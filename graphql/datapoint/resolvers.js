import _ from 'lodash'
import Promise from 'bluebird'
import { GraphqlFormatter, Loader, Time, cknex } from 'backend-shared'

import Datapoint from './model.js'

const datapointLoader = Loader.withContext(async (options, context) => {
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

  return Promise.map(options, ({ metricId, dimensionId }) => {
    return Datapoint.getAllByMetricIdAndDimensionIdAndTimes(metricId, dimensionId, {
      minScaledTime, maxScaledTime
    })
  }
  )
}, { batchScheduleFn: (callback) => setTimeout(callback, 10) })

export default {
  Dimension: {
    datapoints: async (dimension, { startDate, endDate, timeScale }, context) => {
      const metric = dimension._metric
      const block = metric._block

      if (block?.settings.type === 'us-map' || block?.settings.dimensionId) {
        timeScale = 'all'
      }

      let datapoints
      if (metric.type === 'derived') {
        datapoints = await getDerivedDatapoints(
          dimension, { context, startDate, endDate, timeScale }
        )
      } else {
        datapoints = await getDatapoints(
          dimension, { context, startDate, endDate, timeScale }
        )
      }

      return GraphqlFormatter.fromScylla(datapoints)
    }
  }
}

async function getDatapoints (dimension, { context, startDate, endDate, timeScale }) {
  const metric = dimension._metric
  console.log(metric)
  const datapoints = await datapointLoader(context).load(
    [metric.id, dimension.id, startDate, endDate, timeScale].join(':')
  )

  return sumDatapointsIfNecessary(dimension, datapoints)
}

async function getDerivedDatapoints (dimension, { context, startDate, endDate, timeScale }) {
  const metric = dimension._metric
  const transforms = metric.transforms || []
  const transformsWithDatapoints = await Promise.map(
    transforms,
    async ({ operation, metricId, dimensionId }) => {
      dimensionId = dimensionId || dimension.id || cknex.emptyUuid
      let datapoints = await datapointLoader(context).load(
        [metricId, dimensionId, startDate, endDate, timeScale].join(':')
      )
      datapoints = sumDatapointsIfNecessary(dimension, datapoints)
      return { operation, datapoints }
    }
  )
  let datapoints = transformsWithDatapoints[0].datapoints
  _.forEach(transformsWithDatapoints.splice(1), (transform) => {
    const transformDatapointsByScaledTime = _.keyBy(transform.datapoints, (datapoint) =>
      [datapoint.scaledTime, datapoint.dimensionValue].join(':')
    )
    datapoints = _.map(datapoints, (datapoint) => {
      const key = [datapoint.scaledTime, datapoint.dimensionValue].join(':')
      const transformDatapoint = transformDatapointsByScaledTime[key]

      if (!transformDatapoint) {
        return datapoint
      }

      switch (transform.operation) {
        case '*':
          datapoint.count *= transformDatapoint.count
          break
        case '/':
          datapoint.count /= transformDatapoint.count
          break
      }
      return datapoint
    })
  })
  return datapoints
}

function sumDatapointsIfNecessary (dimension, datapoints) {
  const metric = dimension._metric
  const block = metric._block
  if (['overview', 'bar', 'pie', 'us-map'].includes(block?.settings.type)) {
    const datapointsGroups = _.groupBy(datapoints, ({ dimensionId, dimensionValue }) =>
      [dimensionId, dimensionValue].join(':')
    )
    datapoints = _.map(datapointsGroups, (datapoints, dimension) => {
      const [dimensionId, dimensionValue] = dimension.split(':')
      return {
        dimensionId,
        dimensionValue,
        scaledTime: 'sum',
        count: _.sumBy(datapoints, 'count')
      }
    })
  }

  return datapoints
}
