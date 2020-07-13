import _ from 'lodash'
import Promise from 'bluebird'
import moment from 'moment'
import { GraphqlFormatter, Loader, Time, cknex } from 'backend-shared'

import Datapoint from './model.js'
import Dimension from '../dimension/model.js'
import Metric from '../metric/model.js'
import Unique from '../unique/model.js'
import { getDatapoints, getDerivedDatapoints } from '../../services/datapoint.js'
import config from '../../config.js'

const RETENTION_TYPES = [
  { scale: 'day', prefix: 'd', max: 7 },
  { scale: 'week', prefix: 'w', max: 12 },
  { scale: 'month', prefix: 'm', max: 12 },
  { scale: 'year', prefix: 'm', max: 12 }
]

const datapointLoaderFn = Loader.withContext(async (options, context) => {
  options = _.map(options, (option) => {
    const [metricId, dimensionId, startDate, endDate, timeScale] = option.split(':')
    return { metricId, dimensionId, startDate, endDate, timeScale }
  })
  const { startDate, endDate, timeScale } = options[0]
  console.log(startDate, endDate, timeScale)
  const minScaledTime = Time.getScaledTimeByTimeScale(timeScale, startDate)
  const maxScaledTime = Time.getScaledTimeByTimeScale(timeScale, endDate)

  // combining into 1 query doesn't really work...
  // multi-column `WHERE (metricId, dimensionId, timeBucket) in (...)` doesn't work for primaryKeys
  // const datapoints = await Datapoint.getAllByMetricIdsAndDimensionIdsAndTimes(
  //   metricIds, dimensionIds, { minScaledTime, maxScaledTime }
  // )

  console.log('get all', minScaledTime, maxScaledTime, timeScale, startDate, endDate)

  return Promise.map(options, ({ metricId, dimensionId }) => {
    return Datapoint.getAllByMetricIdAndDimensionIdAndTimes(metricId, dimensionId, {
      minScaledTime, maxScaledTime
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

  // FIXME: DRY
  Mutation: {
    datapointIncrement: async (rootValue, options, context) => {
      const {
        metricSlug, dimensionValues, count, date, setTotal, timeScale = 'day'
      } = options
      // FIXME: setTotal
      const metricLoader = await metricLoaderFn(context)
      const dimensionLoader = await dimensionLoaderFn(context)
      const metric = metricLoader.load(metricSlug)
      const dimensions = await getDimensions(
        dimensionValues, { metricLoader, dimensionLoader }
      )
      console.log('dim', dimensions)
      await Promise.map(dimensions, (dimension) => {
        const datapoint = {
          metricId: metric.id,
          dimensionId: dimension.id,
          dimensionValue: dimension.value || 'all',
          scaledTime: Time.getScaledTimeByTimeScale(timeScale, date)
        }
        console.log('inc', datapoint, count, setTotal)
        // Datapoint.incrementAllTimeScales(datapoint, count)
      })
      return true
    },

    datapointIncrementUnique: async (rootValue, { metricSlug, hash, date }, { org }) => {
      console.log({ metricSlug, hash, date })
      await incrementUnique({ metricSlug, hash, date, org })
      return true
    }
  }
}

async function incrementUnique ({ metricSlug, dimensionId, dimensionValue, hash, date, org }) {
  console.log('inc')
  const metric = await Metric.getByOrgIdAndSlug(org.id, metricSlug)
  const scaledTimes = Time.getScaledTimesByTimeScales(Datapoint.TIME_SCALES, date)
  const uniques = await Unique.getAll({
    metricId: metric.id, dimensionId, dimensionValue, hash, scaledTimes
  })
  const allUnique = _.find(uniques, { scaledTime: 'ALL' })
  if (allUnique && !dimensionId) { // prev infinite loop w/ dimensionId
    // TODO: cap it at d30. add week1-12, add month 1-12 (or 3, google does 3)
    Promise.map(RETENTION_TYPES, async ({ scale, prefix, max }) => {
      const countSinceAllUnique = moment(date).diff(allUnique.addTime, scale)
      if (countSinceAllUnique > 0 && countSinceAllUnique <= max) {
        await incrementUnique({
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
    Unique.upsert({ metricId: metric.id, dimensionId, dimensionValue, hash, scaledTime, addTime: date })
    Datapoint.increment({ metricId: metric.id, dimensionId, dimensionValue, scaledTime })
  })
}

async function getDimensions (dimensionValues, { metricLoader, dimensionLoader }) {
  const dimensions = await Promise.all(_.map(dimensionValues, async (value, dimensionSlug) => {
    const dimension = await dimensionLoader.load(dimensionSlug)
    return {
      id: dimension.id,
      value: dimension.type === 'derived'
        ? await getDerivedDimensionValue(dimension, value, { metricLoader })
        : value
    }
  }))

  return dimensions.concat([{ id: cknex.emptyUuid, value: 'all' }])
}

async function getDerivedDimensionValue ({ transforms }, { hash }, { metricLoader }) {
  const transformsWithUniques = await Promise.map(
    transforms, async (transform) => {
      // TODO: loader? if there are ever any that pull from more than 1 unique
      const unique = transform.metricId && await Unique.get({
        metricId: transform.metricId,
        dimensionId: transform.dimensionId,
        dimensionValue: transform.dimensionValue,
        hash,
        scaledTime: 'ALL'
      })
      return _.defaults({ value: unique }, transform)
    }
  )
  let value = transformsWithUniques[0].value
  _.forEach(transformsWithUniques.splice(1), (transform) => {
    switch (transform.operation) {
      case 'dateDiff':
        value = moment().diff(moment(value.addTime), transform.value)
        break
      case '<':
        value = value < transform.value
        break
    }
  })
  return value
}
