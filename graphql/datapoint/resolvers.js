import _ from 'lodash'
import Promise from 'bluebird'
import { GraphqlFormatter, Loader, Time, cknex } from 'backend-shared'

import Datapoint from './model.js'
import {
  getDatapoints, getDerivedDatapoints, addZeroes
} from '../../services/datapoint.js'

// TODO: write tests
// TODO: log all database operations and see if loaders are setup properly

// combining into 1 query doesn't really work...
// multi-column `WHERE (metricId, dimensionId, timeBucket) in (...)` doesn't work for primaryKeys
// load is still somewhat useful since some metrics datapoint will be loaded in multiple times
// for derived metrics
const datapointLoaderFn = Loader.withContext(async (options, context) => {
  options = _.map(options, (option) => {
    const [metricId, segmentId, dimensionId, dimensionValue, startDate, endDate, timeScale] = option.split(':')
    return { metricId, segmentId, dimensionId, dimensionValue, startDate, endDate, timeScale }
  })
  const { startDate, endDate, timeScale } = options[0]
  console.log(startDate, endDate, timeScale, options.segmentId)
  const minScaledTime = Time.getScaledTimeByTimeScale(timeScale, startDate)
  const maxScaledTime = Time.getScaledTimeByTimeScale(timeScale, endDate)

  // const datapoints = await Datapoint.getAllByMetricIdsAndDimensionIdsAndTimes(
  //   metricIds, dimensionIds, { minScaledTime, maxScaledTime }
  // )

  return Promise.map(options, ({ metricId, segmentId, dimensionId, dimensionValue }) => {
    return Datapoint.getAllByMetricIdAndDimensionAndTimes(metricId, segmentId, dimensionId, dimensionValue, {
      timeScale, minScaledTime, maxScaledTime
    })
  }
  )
}, { batchScheduleFn: (callback) => setTimeout(callback, 10) })

export default {
  Dimension: {
    datapoints: async (dimension, { segmentId, startDate, endDate, timeScale }, context) => {
      const loader = datapointLoaderFn(context)
      const metric = dimension._metric
      const block = metric._block

      // let segmentId
      // if (segmentSlug) {
      //   const contextWithOrgId = _.defaults({ orgId: metric.orgId }, context)
      //   const segment = await segmentLoaderFn(contextWithOrgId).load(segmentSlug)
      //   segmentId = segment?.id
      // }
      segmentId = segmentId || cknex.emptyUuid

      if (block?.settings.type === 'us-map' || block?.settings.dimensionId) {
        timeScale = 'all'
      }

      let datapoints
      if (metric.type === 'derived') {
        datapoints = await getDerivedDatapoints(
          dimension, { loader, segmentId, startDate, endDate, timeScale }
        )
      } else {
        datapoints = await getDatapoints(
          dimension, { loader, segmentId, startDate, endDate, timeScale }
        )
      }

      if (block?.settings.type === 'line' && !block?.settings.omitZeroes && startDate && endDate && timeScale) {
        datapoints = addZeroes(datapoints, { dimension, segmentId, startDate, endDate, timeScale })
      }

      return GraphqlFormatter.fromScylla(datapoints)
    }
  }
}
