import _ from 'lodash'
import request from 'request-promise'
import ZipCodeData from 'zipcode-data'
import Promise from 'bluebird'
import moment from 'moment'
import { Loader, Time, cknex } from 'backend-shared'

import Datapoint from '../graphql/datapoint/model.js'
import Dimension from '../graphql/dimension/model.js'
import Metric from '../graphql/metric/model.js'

const ORG_ID = 'b6295100-bb45-11ea-91c2-9d708da068b3' // upchieve

export async function importDatapoints ({ startDate, endDate, timeScale, incrementAll }) {
  const metrics = await getUpchieveMetrics({ startDate, endDate, timeScale })

  const metricLoader = Loader.withContext(async (slugs, context) => {
    return Metric.getAllByOrgIdAndSlugs(ORG_ID, slugs)
      .then((metrics) => {
        metrics = _.keyBy(metrics, 'slug')
        return _.map(slugs, slug => metrics[slug])
      })
  })
  const dimensionLoader = Loader.withContext(async (slugs, context) => {
    return Dimension.getAllByOrgIdAndSlugs(ORG_ID, slugs)
      .then((dimensions) => {
        dimensions = _.keyBy(dimensions, 'slug')
        return _.map(slugs, slug => dimensions[slug])
      })
  })
  const context = { c: 'context' }

  const datapoints = _.flatten(await Promise.map(metrics, async ({ slug, datapoints }) => {
    const metric = await metricLoader(context).load(slug)
    const metricId = metric.id
    const metricDatapoints = await Promise.map(datapoints, async (datapoint) => {
      // legacy fix
      if (datapoint.scaledTime === 'ALL') { datapoint.scaledTime = 'ALL:ALL' }

      // legacy fix
      const timeScalePrefix = datapoint.scaledTime.match(/([A-Z]+):/)[1]
      const timeScale = timeScalePrefix === 'All'
        ? 'all'
        : timeScalePrefix === 'DAY'
          ? 'day'
          : timeScalePrefix === 'BIWK'
            ? 'biweek'
            : timeScalePrefix === 'WK'
              ? 'week'
              : timeScalePrefix === 'MON'
                ? 'month'
                : timeScalePrefix === 'YR'
                  ? 'year'
                  : 'minute'

      let dimensionId
      if (datapoint.dimensionSlug === 'all') {
        dimensionId = cknex.emptyUuid
      } else {
        const dimension = await dimensionLoader(context).load(datapoint.dimensionSlug)
        if (!dimension) {
          console.log('missing', datapoint.dimensionSlug)
        }
        dimensionId = dimension.id
      }

      return {
        metricId,
        dimensionId,
        timeScale,
        dimensionValue: datapoint.dimensionValue || 'all',
        scaledTime: datapoint.scaledTime,
        count: datapoint.count
      }
    })
    const dimensionIds = _.uniq(_.map(metricDatapoints, 'dimensionId'))
    const existingDatapoints = _.flatten(await Promise.map(dimensionIds, (dimensionId) => {
      return Datapoint.getAllByMetricIdAndDimensionAndTimes(
        metricId, dimensionId, '', {
          timeScale,
          minScaledTime: Time.getScaledTimeByTimeScale(timeScale, moment.utc(startDate)),
          maxScaledTime: Time.getScaledTimeByTimeScale(timeScale, moment.utc(endDate))
        }
      )
    }))
    // console.log('exist', existingDatapoints)
    return _.filter(_.map(metricDatapoints, (datapoint) => {
      const existingDatapoint = _.find(existingDatapoints, _.omit(datapoint, 'count'))
      if (!existingDatapoint) {
        return datapoint
      } else if (incrementAll && Math.abs(datapoint.count - existingDatapoint.count)) {
        return _.defaults({ count: datapoint.count - existingDatapoint.count }, datapoint)
      }
    }))
  }))

  return Promise.map(
    datapoints,
    (datapoint) => {
      if (incrementAll) {
        Datapoint.incrementAllTimeScales(_.omit(datapoint, 'count'), datapoint.count)
      } else {
        Datapoint.increment(_.omit(datapoint, 'count'), datapoint.count)
      }
    }, { concurrency: 100 }
  ).tap(() => { console.log('done') })
}

// importDatapoints({ startDate: '2020-07-18', endDate: '2020-07-18', timeScale: 'day', incrementAll: true })
// importDatapoints({ startDate: '2020-07-10', endDate: '2020-07-18', timeScale: 'day' })
// single run import:
// Promise.each([
//   { startDate: '2018-01-01', endDate: '2020-07-19', timeScale: 'month' },
//   { startDate: '2018-01-01', endDate: '2020-07-19', timeScale: 'week' },
//   { startDate: '2018-01-01', endDate: '2020-07-19', timeScale: 'day' },
//   { startDate: '2018-01-01', endDate: '2020-07-19', timeScale: 'all' }
// ], importDatapoints)

async function getUpchieveMetrics ({ startDate, endDate, timeScale = 'day' }) {
  console.log('upchieve req')
  let metrics = await request(
    `https://app.upchieve.org/metrics?minTime=${startDate}&maxTime=${endDate}&timeScale=${timeScale}`
    , { json: true }
  )
  metrics = _.map(metrics, (metric) => {
    metric.datapoints = _.filter(_.map(metric.datapoints, (datapoint) => {
      const dimensionSlug = datapoint.dimensionSlug === 'zip'
        ? 'state'
        : datapoint.dimensionSlug || 'all'
      let dimensionValue = datapoint.dimensionValue || 'all'
      if (datapoint.dimensionSlug === 'zip') {
        try {
          dimensionValue = ZipCodeData.stateFromZip(datapoint.dimensionValue)
        } catch (err) {
          return null
        }
      }
      return _.defaults({ dimensionSlug, dimensionValue }, datapoint)
    }))

    if (metric.slug === 'students') {
      const datapointsByDimensionValue = _.groupBy(metric.datapoints, ({ scaledTime, dimensionId, dimensionValue }) =>
        `${scaledTime}:${dimensionId}:${dimensionValue}`
      )
      metric.datapoints = _.map(datapointsByDimensionValue, (datapoints) => {
        return _.defaults({ count: _.sumBy(datapoints, 'count') }, datapoints[0])
      })
    }

    return metric
  })

  return metrics
}
