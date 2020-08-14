import _ from 'lodash'
import request from 'request-promise'
import ZipCodeData from 'zipcode-data'
import Promise from 'bluebird'
import moment from 'moment-timezone'
import { Loader, Time, cknex } from 'backend-shared'

import Datapoint from '../graphql/datapoint/model.js'
import Dimension from '../graphql/dimension/model.js'
import Metric from '../graphql/metric/model.js'
import Segment from '../graphql/segment/model.js'

const ORG_ID = 'b6295100-bb45-11ea-91c2-9d708da068b3' // upchieve

export async function importDatapoints ({ startDate, endDate, timeScale, incrementAll }) {
  console.log('import....')
  const metrics = await getUpchieveMetrics({ startDate, endDate, timeScale })

  const metricLoader = Loader.withContext(async (slugs, context) => {
    return Metric.getAllByOrgIdAndSlugs(ORG_ID, slugs)
      .then((metrics) => {
        metrics = _.keyBy(metrics, 'slug')
        return _.map(slugs, slug => metrics[slug])
      })
  })
  const segmentLoader = Loader.withContext(async (slugs, context) => {
    return Segment.getAllByOrgIdAndSlugs(ORG_ID, slugs)
      .then((segments) => {
        segments = _.keyBy(segments, 'slug')
        return _.map(slugs, slug => segments[slug])
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
  await Promise.map(metrics, async ({ slug, datapoints }) => {
    const metric = await metricLoader(context).load(slug)
    const metricId = metric.id
    let metricDatapoints = await Promise.map(datapoints, async (datapoint) => {
      // legacy fix
      if (datapoint.scaledTime === 'ALL') { datapoint.scaledTime = 'ALL:ALL' }

      // legacy fix
      if (!datapoint.scaledTime) {
        console.log(datapoint)
      }
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

      let segmentId
      if (datapoint.segmentSlug) {
        const segment = await segmentLoader(context).load(datapoint.segmentSlug)
        if (!segment) {
          console.log('missing segment', datapoint.segmentSlug)
          segmentId = null
        } else {
          segmentId = segment.id
        }
      } else {
        segmentId = cknex.emptyUuid
      }

      return {
        metricId,
        segmentId,
        dimensionId,
        timeScale,
        dimensionValue: datapoint.dimensionValue || 'all',
        scaledTime: datapoint.scaledTime,
        count: datapoint.count
      }
    })
    metricDatapoints = _.filter(metricDatapoints, 'segmentId')
    const segmentIds = _.uniq(_.map(metricDatapoints, 'segmentId'))
    const dimensionIds = _.uniq(_.map(metricDatapoints, 'dimensionId'))
    const existingDatapoints = _.flattenDeep(await Promise.map(segmentIds, async (segmentId) => {
      return await Promise.map(dimensionIds, (dimensionId) => {
        return Datapoint.getAllByMetricIdAndDimensionAndTimes(
          metricId, segmentId, dimensionId, '', {
            timeScale,
            minScaledTime: Time.getScaledTimeByTimeScale(timeScale, moment.utc(startDate)),
            maxScaledTime: Time.getScaledTimeByTimeScale(timeScale, moment.utc(endDate))
          }
        )
      })
    }))
    //     {
    //   metricId: '9285d290-bb46-11ea-afef-2f1fddc92f4e',
    //   segmentId: '7eafc923-d80f-11ea-8cf2-fe3996136618',
    //   dimensionId: '8cf0f770-bee2-11ea-a00e-3050789e3d8f',
    //   timeScale: 'day',
    //   timeBucket: 'YR:2020',
    //   scaledTime: 'DAY:2020-08-10',
    //   dimensionValue: 'prealgebra',
    //   count: 9
    // },

    // console.log('exist', existingDatapoints)
    return Promise.map(metricDatapoints, (datapoint) => {
      const existingDatapoint = _.find(existingDatapoints, _.omit(datapoint, 'count'))
      if (existingDatapoint && Math.abs(datapoint.count - existingDatapoint.count)) {
        datapoint = _.defaults({ count: datapoint.count - existingDatapoint.count }, datapoint)
      // }
      } else if (!existingDatapoint) {
        console.log('no exist', datapoint)
      }
      if (incrementAll && datapoint) {
        return Datapoint.incrementAllTimeScales(_.omit(datapoint, 'count'), datapoint.count)
      } else if (datapoint) {
        return Datapoint.increment(_.omit(datapoint, 'count'), datapoint.count)
      }
    }, { concurrency: 1 })
  }, { concurrency: 1 }).tap(() => { console.log('done') })

  // console.log('seg', _.filter(datapoints, { segmentId: 'c373ae96-d752-11ea-9abd-8d089f03a8e8' }))
}

// importDatapoints({ startDate: '2020-08-05', endDate: '2020-08-05', timeScale: 'day', incrementAll: true })
// importDatapoints({ startDate: '2020-08-01', endDate: '2020-08-11', timeScale: 'day' })
// single run import:
// Promise.each([
//   { startDate: '2018-01-01', endDate: '2020-08-11', timeScale: 'month' },
//   { startDate: '2018-01-01', endDate: '2020-08-11', timeScale: 'week' },
//   { startDate: '2018-01-01', endDate: '2020-08-11', timeScale: 'day' },
//   { startDate: '2018-01-01', endDate: '2020-08-11', timeScale: 'all' }
// ], importDatapoints)

async function getUpchieveMetrics ({ startDate, endDate, timeScale = 'day' }) {
  console.log('upchieve req', `http://localhost:3000/metrics?minTime=${startDate}&maxTime=${endDate}&timeScale=${timeScale}`)
  let metrics = await request(
    `https://app.upchieve.org/metrics?minTime=${startDate}&maxTime=${endDate}&timeScale=${timeScale}`
    // `http://localhost:3000/metrics?minTime=${startDate}&maxTime=${endDate}&timeScale=${timeScale}`
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

    // FIXME: rm true when upchieve fix merged in
    if (true || metric.slug === 'students') {
      // FIXME: rm when upchieve fix merged in
      const fixedDatapoints = _.map(metric.datapoints, (datapoint) => {
        const timeScalePrefix = datapoint.scaledTime.match(/([A-Z]+):/)[1]
        if (timeScalePrefix === 'MIN') {
          const date = Time.scaledTimeToUTC(datapoint.scaledTime)
          const scaledTime = Time.getScaledTimeByTimeScale(timeScale, date, 'America/Chicago')
          // console.log(datapoint.scaledTime, scaledTime)
          return _.defaults({ scaledTime }, datapoint)
        } else {
          return datapoint
        }
      })
      // end FIXME

      const datapointsByDimensionValue = _.groupBy(fixedDatapoints, ({ segmentSlug, scaledTime, dimensionSlug, dimensionValue }) =>
        `${segmentSlug}:${scaledTime}:${dimensionSlug}:${dimensionValue}`
      )
      metric.datapoints = _.map(datapointsByDimensionValue, (datapoints) => {
        return _.defaults({ count: _.sumBy(datapoints, 'count') }, datapoints[0])
      })
    }

    return metric
  })

  return metrics
}
