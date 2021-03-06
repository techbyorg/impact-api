
import _ from 'lodash'
import crypto from 'crypto'
import Moment from 'moment-timezone'
import momentRange from 'moment-range'
import Promise from 'bluebird'
import { cknex, Time } from 'backend-shared'

import Datapoint from '../graphql/datapoint/model.js'
import Metric from '../graphql/metric/model.js'
import Unique from '../graphql/unique/model.js'

const { extendMoment } = momentRange
const moment = extendMoment(Moment)

export async function getDatapoints (dimension, { loader, segmentId, startDate, endDate, timeScale }) {
  const metric = dimension._metric
  const datapoints = await loader.load(
    [metric.id, segmentId, dimension.id, '', startDate, endDate, timeScale].join(':')
  )

  return sumDatapointsIfNecessary(dimension, datapoints)
}

export async function getDerivedDatapoints (dimension, { loader, segmentId, startDate, endDate, timeScale }) {
  const metric = dimension._metric
  const transforms = metric.transforms || []
  const transformsWithDatapoints = await Promise.map(
    transforms,
    async ({ operation, metricId, dimensionId, dimensionValue }) => {
      dimensionId = dimensionId || dimension.id || cknex.emptyUuid
      let datapoints = await loader.load(
        [metricId, segmentId, dimensionId, dimensionValue || '', startDate, endDate, timeScale].join(':')
      )
      datapoints = sumDatapointsIfNecessary(dimension, datapoints)
      return { operation, datapoints, dimensionValue }
    }
  )
  let datapoints = transformsWithDatapoints[0].datapoints
  _.forEach(transformsWithDatapoints.splice(1), (transform) => {
    const transformDatapointsByScaledTime = _.keyBy(transform.datapoints, (datapoint) => {
      if (transform.dimensionValue) {
        return datapoint.scaledTime
      } else {
        return [datapoint.scaledTime, datapoint.dimensionValue].join(':')
      }
    })
    datapoints = _.map(datapoints, (datapoint) => {
      let key
      if (transform.dimensionValue) {
        key = datapoint.scaledTime
      } else {
        key = [datapoint.scaledTime, datapoint.dimensionValue].join(':')
      }
      const transformDatapoint = transformDatapointsByScaledTime[key]

      if (!transformDatapoint) {
        return datapoint
      }

      switch (transform.operation) {
        case '*':
          datapoint.count *= transformDatapoint.count
          break
        case '/':
          if (transformDatapoint.count) {
            datapoint.count /= transformDatapoint.count
          } else {
            datapoint.count = 0
          }
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

export async function getDimensions (dimensionValues, { metricLoader, dimensionLoader }) {
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
  // clients should be hashing, but we'll hash just in case they don't
  const potentiallyHashed = hash
  hash = crypto.createHash('sha256').update(potentiallyHashed).digest('base64')

  const transformsWithUniques = await Promise.map(
    transforms, async (transform) => {
      // TODO: loader? if there are ever any that pull from more than 1 unique
      const unique = transform.metricId && await Unique.get({
        metricId: transform.metricId,
        segmentId: transform.segmentId,
        dimensionId: transform.dimensionId,
        dimensionValue: transform.dimensionValue,
        hash,
        scaledTime: 'ALL:ALL'
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
      case 'stringify':
        value = `${value}`
        break
      case 'stateFromZip': // FIXME: don't use base metricId
        value = `${value}`
        break
    }
  })
  return value
}

export async function adjustCountForTotal ({ count, metric, dimension, segmentId, timeScale, scaledTime }) {
  const currentDatapoint = await Datapoint.get(metric.id, segmentId, dimension.id, dimension.value, timeScale, scaledTime)
  if (currentDatapoint) {
    console.log('adjust', 'set', count, 'current', dimension.id, dimension.value, currentDatapoint.count)
    count = count - currentDatapoint.count
  }
  return count
}

export function addZeroes (datapoints, { dimension, startDate, endDate, timeScale }) {
  const metric = dimension._metric

  // if there is no data at end of time frame, don't force zeroes
  const recentDatapointScaledTime = _.first(datapoints)?.scaledTime
  if (recentDatapointScaledTime) {
    const datapointsEndDate = moment.utc(Time.scaledTimeToUTC(recentDatapointScaledTime))
      .format('YYYY-MM-DD')
    endDate = _.min([endDate, datapointsEndDate])
  }

  const range = moment.range(startDate, endDate)
  const rangeArr = Array.from(range.by(timeScale))
  const allDatapoints = _.map(rangeArr, (date) => ({
    metricId: metric.id,
    dimensionId: dimension.id,
    dimensionValue: datapoints[0]?.dimensionValue || 'all',
    scaledTime: Time.getScaledTimeByTimeScale(timeScale, date),
    count: 0
  }))
  const datapointsWithZeroes = _.unionBy(datapoints, allDatapoints, (datapoint) => (
    [datapoint.scaledTime, datapoint.dimensionValue].join('|')
  ))
  return _.orderBy(datapointsWithZeroes, 'scaledTime', 'asc')
}

export function setMetricFirstDatapointTimeIfNecessary (metric, date) {
  if (!metric.firstDatapointTime || metric.firstDatapointTime > date) {
    Metric.upsertByRow(metric, { firstDatapointTime: date })
  }
}
