import _ from 'lodash'
import request from 'request-promise'
// import Moment from 'moment'
// import momentRange from 'moment-range'
import { GraphqlFormatter, Loader } from 'backend-shared'
import ZipCodeData from 'zipcode-data' // FIXME: eventually rm (after upchieve)

// import Datapoint from './model.js'

// const { extendMoment } = momentRange
// const moment = extendMoment(Moment)

const datapointLoader = Loader.withContext(async (options, context) => {
  const { startDate, endDate, timeScale } = options[0]
  const metricSlugs = _.map(options, 'metricSlug')
  const metrics = await getUpchieveMetrics({ metricSlugs, startDate, endDate, timeScale })
  return _.map(
    options,
    ({ metricSlug, dimensionSlug }) => {
      const datapoints = _.find(metrics, { slug: metricSlug })?.datapoints || []
      return _.filter(datapoints, { dimensionSlug })
    }
  )
})

export default {
  Dimension: {
    datapoints: async (dimension, { startDate, endDate, timeScale }, context) => {
      const metric = dimension._metric
      const block = metric._block

      if (block?.settings.type === 'us-map' || block?.settings.dimensionSlug) {
        timeScale = 'all'
      }

      let datapoints = await datapointLoader(context).load({
        metricSlug: metric.slug, dimensionSlug: dimension.slug, startDate, endDate, timeScale
      })

      if (['overview', 'bar', 'pie'].includes(block?.settings.type)) {
        const datapointsGroups = _.groupBy(datapoints, ({ dimensionSlug, dimensionValue }) =>
          [dimensionSlug, dimensionValue].join(':')
        )
        datapoints = _.map(datapointsGroups, (datapoints, dimension) => {
          const [dimensionSlug, dimensionValue] = dimension.split(':')
          return {
            dimensionSlug,
            dimensionValue,
            scaledTime: 'sum',
            count: _.sumBy(datapoints, 'count')
          }
        })
      }
      // else if (['day', 'week', 'month'].includes(timeScale)) {
      //   const range = moment.range(
      //     Time.dateToUTC(new Date(startDate)),
      //     Time.dateToUTC(new Date(endDate))
      //   )
      //   const rangeArr = Array.from(range.by(timeScale))
      //   const allDatapoints = _.map(rangeArr, (date) => ({
      //     scaledTime: Time.getScaledTimeByTimeScale(timeScale, date),
      //     count: 0
      //   }))

      //   datapoints = combineArraysByKey(allDatapoints, datapoints, 'scaledTime')
      // }

      console.log('dp', timeScale, datapoints)

      return GraphqlFormatter.fromScylla(datapoints)
    }
  }
}

async function getUpchieveMetrics ({ metricSlugs, startDate, endDate, timeScale = 'day' }) {
  let metrics = await request(
    `http://localhost:3000/metrics?minTime=${startDate}&maxTime=${endDate}&timeScale=${timeScale}&slugs=${metricSlugs.join(',')}`
    , { json: true }
  )
  metrics = _.map(metrics, (metric) => {
    metric.datapoints = _.map(metric.datapoints, (datapoint) => {
      const dimensionSlug = metric.slug === 'student-zip-distribution'
        ? 'state'
        : datapoint.dimensionSlug || 'all'
      const dimensionValue = metric.slug === 'student-zip-distribution'
        ? ZipCodeData.stateFromZip(datapoint.dimensionValue)
        : datapoint.dimensionValue || 'all'
      return _.defaults({ dimensionSlug, dimensionValue }, datapoint)
    })
    return metric
  })

  return metrics
}

// function combineArraysByKey (arr1, arr2, key) {
//   arr1 = _.cloneDeep(arr1) // don't want to merge in place
//   const obj2 = _.keyBy(arr2, key)
//   return _.map(arr1, (value) => {
//     return obj2[value[key]] || value
//   })
// }
