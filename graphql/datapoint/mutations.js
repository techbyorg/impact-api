import _ from 'lodash'
import Promise from 'bluebird'
import moment from 'moment-timezone'
import crypto from 'crypto'
import { Loader, Time, Cache, cknex } from 'backend-shared'

import Datapoint from './model.js'
import Dimension from '../dimension/model.js'
import Metric from '../metric/model.js'
import Unique from '../unique/model.js'
import { getDimensions, adjustCountForTotal } from '../../services/datapoint.js'
import LOCK_PREFIXES from '../../services/cache.js'
import config from '../../config.js'

const RETENTION_TYPES = [
  { scale: 'day', prefix: 'd', max: 7 },
  { scale: 'week', prefix: 'w', max: 12 },
  { scale: 'month', prefix: 'm', max: 12 },
  { scale: 'year', prefix: 'y', max: 12 }
]
const INCREMENT_UNIQUE_LOCK_EXPIRE_SECONDS = 5

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

// const segmentLoaderFn = Loader.withContext(async (slugs, context) => {
//   const { orgId } = context
//   return Segment.getAllByOrgIdAndSlugs(orgId, slugs)
//     .then((segments) => {
//       segments = _.keyBy(segments, 'slug')
//       return _.map(slugs, slug => segments[slug])
//     })
// })

export default {
  Mutation: {
    datapointIncrement: async (rootValue, options, context) => {
      const {
        metricSlug, dimensionValues, date, isTotal, isSingleTimeScale, timeScale = 'day'
        // segmentSlugs
      } = options
      let { count } = options
      const { org } = context

      const metricLoader = await metricLoaderFn(context)
      const dimensionLoader = await dimensionLoaderFn(context)
      const metric = await metricLoader.load(metricSlug)
      const dimensions = await getDimensions(
        dimensionValues, { metricLoader, dimensionLoader }
      )
      // TODO: get segmentIds from segmentSlugs
      const segmentId = cknex.emptyUuid // TODO
      const scaledTime = Time.getScaledTimeByTimeScale(timeScale, date, org.timezone)

      if (isTotal) {
        // grab current values and adjust count accordingly
        // done for a single dimension so 'all' gets adjusted properly
        if (dimensions.length > 2) { // 2 because all is added in
          throw new Error('Can only set total for 1 dimension at a time')
        }
        count = await adjustCountForTotal({
          count,
          metric,
          dimension: dimensions[0],
          segmentId,
          timeScale,
          scaledTime
        })
      }

      console.log('increment', metricSlug, isTotal, scaledTime, '...', count, segmentId)

      await Promise.map(dimensions, async (dimension) => {
        const datapoint = {
          metricId: metric.id,
          segmentId,
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

    datapointIncrementUnique: async (rootValue, { metricSlug, segmentSlugs, hash, date }, { org }) => {
      // console.log('inc uniq', org)
      const potentiallyHashed = hash
      // clients should be hashing, but we'll hash just in case they don't
      hash = crypto.createHash('sha256').update(potentiallyHashed).digest('base64')
      await incrementUnique({ metricSlug, segmentSlugs, hash, date, org })
      return true
    }
  }
}

async function incrementUnique (options) {
  const {
    metricSlug, dimensionId, dimensionValue, hash, date, org
    // segmentSlugs
  } = options
  const cachePrefix = LOCK_PREFIXES.DATAPOINT_INCREMENT_UNIQUE
  const cacheKey = `${cachePrefix}:${metricSlug}:${dimensionId}:${dimensionValue}:${hash}`
  // not atomic due to unique lookups, so we lock during call
  Cache.lock(cacheKey, async () => {
    // console.log('inc unique', metricSlug, hash)
    const metric = await Metric.getByOrgIdAndSlug(org.id, metricSlug)
    // TODO: get segmentIds from segmentSlugs
    const segmentId = cknex.emptyUuid // TODO
    const scaledTimes = Time.getScaledTimesByTimeScales(Datapoint.TIME_SCALES, date, org.timezone)
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
          ? moment(date || new Date()).diff(allUnique.addTime, scale)
          : 0
        if (countSinceAllUnique <= max) {
          return incrementUnique({
            metricSlug,
            // segementSlugs,
            dimensionId: config.RETENTION_DIMENSION_UUID,
            dimensionValue: `${prefix}${countSinceAllUnique}`,
            hash,
            // eg if today is 1/8 and addTime was 1/1, it's D7 for 1/1
            date: allUnique?.addTime,
            org
          })
        }
      })
    }
    const existingScaledTimes = _.map(uniques, 'scaledTime')
    const missingScaledTimes = _.difference(scaledTimes, existingScaledTimes)
    await Promise.map(missingScaledTimes, (scaledTime) => {
      const timeScale = timeScalesByScaledTime[scaledTime]
      // console.log('inc uniq', metricSlug, dimensionValue, scaledTime)
      return Promise.all([
        Unique.upsert({
          metricId: metric.id, dimensionId, dimensionValue, hash, scaledTime, addTime: date
        }),
        Datapoint.increment({
          metricId: metric.id,
          segmentId,
          dimensionId,
          dimensionValue,
          timeScale,
          scaledTime
        })
      ])
    })
    return true
  }, { expireSeconds: INCREMENT_UNIQUE_LOCK_EXPIRE_SECONDS, unlockWhenCompleted: true })
}
