
import _ from 'lodash'
import { cknex } from 'backend-shared'

export async function getDatapoints (dimension, { loader, startDate, endDate, timeScale }) {
  const metric = dimension._metric
  console.log('get', [metric.id, dimension.id, startDate, endDate, timeScale].join(':'))
  const datapoints = await loader.load(
    [metric.id, dimension.id, startDate, endDate, timeScale].join(':')
  )

  return sumDatapointsIfNecessary(dimension, datapoints)
}

export async function getDerivedDatapoints (dimension, { loader, startDate, endDate, timeScale }) {
  const metric = dimension._metric
  const transforms = metric.transforms || []
  const transformsWithDatapoints = await Promise.map(
    transforms,
    async ({ operation, metricId, dimensionId }) => {
      dimensionId = dimensionId || dimension.id || cknex.emptyUuid
      let datapoints = await loader.load(
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

export function sumDatapointsIfNecessary (dimension, datapoints) {
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
