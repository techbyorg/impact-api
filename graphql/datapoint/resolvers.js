import _ from 'lodash'
import Promise from 'bluebird'
import moment from 'moment'
import crypto from 'crypto'
import { GraphqlFormatter, Loader, Time, Cache } from 'backend-shared'

import Datapoint from './model.js'
import Dimension from '../dimension/model.js'
import Metric from '../metric/model.js'
import Unique from '../unique/model.js'
import {
  getDatapoints, getDerivedDatapoints, getDimensions, adjustCountForTotal
} from '../../services/datapoint.js'
import LOCK_PREFIXES from '../../services/cache.js'
import config from '../../config.js'

const RETENTION_TYPES = [
  { scale: 'day', prefix: 'd', max: 7 },
  { scale: 'week', prefix: 'w', max: 12 },
  { scale: 'month', prefix: 'm', max: 12 },
  { scale: 'year', prefix: 'm', max: 12 }
]
const INCREMENT_UNIQUE_LOCK_EXPIRE_SECONDS = 5

// TODO: write tests
// TODO: log all database operations and see if loaders are setup properly

// combining into 1 query doesn't really work...
// multi-column `WHERE (metricId, dimensionId, timeBucket) in (...)` doesn't work for primaryKeys
// load is still somewhat useful since some metrics datapoint will be loaded in multiple times
// for derived metrics
const datapointLoaderFn = Loader.withContext(async (options, context) => {
  options = _.map(options, (option) => {
    const [metricId, dimensionId, dimensionValue, startDate, endDate, timeScale] = option.split(':')
    return { metricId, dimensionId, dimensionValue, startDate, endDate, timeScale }
  })
  const { startDate, endDate, timeScale } = options[0]
  console.log(startDate, endDate, timeScale)
  const minScaledTime = Time.getScaledTimeByTimeScale(timeScale, startDate)
  const maxScaledTime = Time.getScaledTimeByTimeScale(timeScale, endDate)

  // const datapoints = await Datapoint.getAllByMetricIdsAndDimensionIdsAndTimes(
  //   metricIds, dimensionIds, { minScaledTime, maxScaledTime }
  // )

  return Promise.map(options, ({ metricId, dimensionId, dimensionValue }) => {
    return Datapoint.getAllByMetricIdAndDimensionAndTimes(metricId, dimensionId, dimensionValue, {
      timeScale, minScaledTime, maxScaledTime
    })
  }
  )
}, { batchScheduleFn: (callback) => setTimeout(callback, 10) })

const metricLoaderFn = Loader.withContext(async (slugs, context) => {
  const { org } = context
  return Metric.getAllByOrgIdAndSlugs(org.id, slugs)
    .then((metrics) => {
      metrics = _.keyBy(metrics, 'slug')
      return _.map(slugs, slug => metrics[slug])
    })
})

const dimensionLoaderFn = Loader.withContext(async (slugs, context) => {
  const { org } = context
  return Dimension.getAllByOrgIdAndSlugs(org.id, slugs)
    .then((dimensions) => {
      dimensions = _.keyBy(dimensions, 'slug')
      return _.map(slugs, slug => dimensions[slug])
    })
})

export default {
  Dimension: {
    datapoints: async (dimension, { startDate, endDate, timeScale }, context) => {
      const loader = datapointLoaderFn(context)
      const metric = dimension._metric
      const block = metric._block

      if (block?.settings.type === 'us-map' || block?.settings.dimensionId) {
        timeScale = 'all'
      }

      let datapoints
      if (metric.type === 'derived') {
        datapoints = await getDerivedDatapoints(
          dimension, { loader, startDate, endDate, timeScale }
        )
      } else {
        datapoints = await getDatapoints(
          dimension, { loader, startDate, endDate, timeScale }
        )
      }

      return GraphqlFormatter.fromScylla(datapoints)
    }
  },

  Mutation: {
    datapointIncrement: async (rootValue, options, context) => {
      const {
        metricSlug, dimensionValues, date, isTotal, isSingleTimeScale, timeScale = 'day'
      } = options
      let { count } = options
      console.log('increment', metricSlug, isTotal)

      const metricLoader = await metricLoaderFn(context)
      const dimensionLoader = await dimensionLoaderFn(context)
      const metric = await metricLoader.load(metricSlug)
      const dimensions = await getDimensions(
        dimensionValues, { metricLoader, dimensionLoader }
      )
      const scaledTime = Time.getScaledTimeByTimeScale(timeScale, date)
      // FIXME: "all dimension" should be treated differently for isTotal
      // eg { browser: 'chrome', os: 'linux' }

      if (isTotal) {
        // grab current values and adjust count accordingly
        // done for a single dimension so 'all' gets adjusted properly
        if (dimensions.length > 2) { // 2 because all is added in
          throw new Error('Can only set total for 1 dimension at a time')
        }
        count = await adjustCountForTotal({
          count, metric, dimension: dimensions[0], timeScale, scaledTime
        })
      }

      await Promise.map(dimensions, async (dimension) => {
        const datapoint = {
          metricId: metric.id,
          dimensionId: dimension.id,
          dimensionValue: dimension.value,
          timeScale,
          scaledTime
        }
        if (count && isSingleTimeScale) {
          Datapoint.increment(datapoint, count)
        } else if (count) {
          Datapoint.incrementAllTimeScales(datapoint, count)
        }
      })
      return true
    },

    datapointIncrementUnique: async (rootValue, { metricSlug, hash, date }, { org }) => {
      console.log('inc uniq')
      const potentiallyHashed = hash
      // clients should be hashing, but we'll hash just in case they don't
      hash = crypto.createHash('sha256').update(potentiallyHashed).digest('base64')
      await incrementUnique({ metricSlug, hash, date, org })
      return true
    }
  }
}

async function incrementUnique ({ metricSlug, dimensionId, dimensionValue, hash, date, org }) {
  const cachePrefix = LOCK_PREFIXES.DATAPOINT_INCREMENT_UNIQUE
  const cacheKey = `${cachePrefix}:${metricSlug}:${dimensionId}:${dimensionValue}:${hash}`
  // not atomic due to unique lookups, so we lock during call
  Cache.lock(cacheKey, async () => {
    // console.log('inc unique', metricSlug, hash)
    const metric = await Metric.getByOrgIdAndSlug(org.id, metricSlug)
    const scaledTimes = Time.getScaledTimesByTimeScales(Datapoint.TIME_SCALES, date)
    const timeScalesByScaledTime = _.zipObject(scaledTimes, Datapoint.TIME_SCALES)
    const uniques = await Unique.getAll({
      metricId: metric.id, dimensionId, dimensionValue, hash, scaledTimes
    })
    const allUnique = _.find(uniques, { scaledTime: 'ALL:ALL' })
    // track retention for any unique metric. retention is hour-based not calendar-day based.
    // eg. d1 is for 24-48 hours after first visit.
    if (dimensionId !== config.RETENTION_DIMENSION_UUID) {
      await Promise.map(RETENTION_TYPES, async ({ scale, prefix, max }) => {
        // we still want to track d0/w0/m0/y0 so we can divide by that to get retention
        // moment.diff truncates (Math.floor), not round, which is what we want
        const countSinceAllUnique = allUnique
          ? moment(date).diff(allUnique.addTime, scale)
          : 0
        if (countSinceAllUnique <= max) {
          return incrementUnique({
            metricSlug,
            dimensionId: config.RETENTION_DIMENSION_UUID,
            dimensionValue: `${prefix}${countSinceAllUnique}`,
            hash,
            date,
            org
          })
        }
      })
    }
    const existingScaledTimes = _.map(uniques, 'scaledTime')
    const missingScaledTimes = _.difference(scaledTimes, existingScaledTimes)
    await Promise.map(missingScaledTimes, (scaledTime) => {
      const timeScale = timeScalesByScaledTime[scaledTime]
      return Promise.all([
        Unique.upsert({
          metricId: metric.id, dimensionId, dimensionValue, hash, scaledTime, addTime: date
        }),
        Datapoint.increment({ metricId: metric.id, dimensionId, dimensionValue, timeScale, scaledTime })
      ])
    })
    return true
  }, { expireSeconds: INCREMENT_UNIQUE_LOCK_EXPIRE_SECONDS, unlockWhenCompleted: true })
}
