import _ from 'lodash'
import request from 'request-promise'
import Moment from 'moment'
import momentRange from 'moment-range'
import { Time, GraphqlFormatter, Loader } from 'backend-shared'

// import Datapoint from './model.js'

const { extendMoment } = momentRange
const moment = extendMoment(Moment)

const datapointLoader = Loader.withContext(async (options, context) => {
  const { startDate, endDate, timeScale } = options[0]
  const slugs = _.map(options, 'slug')
  const metrics = await getUpchieveMetrics({ slugs, startDate, endDate, timeScale })
  const res = _.map(slugs, (slug) => _.find(metrics, { slug })?.datapoints || [])
  return res
})

export default {
  Metric: {
    datapoints: async (metric, { startDate, endDate, timeScale }, context) => {
      let datapoints = await datapointLoader(context).load({
        slug: metric.slug, startDate, endDate, timeScale
      })

      if (metric._block?.settings.type === 'overview') {
        datapoints = [{
          scaledTime: 'SUM',
          count: _.sumBy(datapoints, 'count')
        }]
      }

      return GraphqlFormatter.fromScylla(datapoints)
    }
  }
}

async function getUpchieveMetrics ({ slugs, startDate, endDate, timeScale = 'day' }) {
  // FIXME: pull from upchieve for now
  const range = moment.range(
    Time.dateToUTC(new Date(startDate)),
    Time.dateToUTC(new Date(endDate))
  )
  const rangeArr = Array.from(range.by(timeScale))
  const allDatapoints = _.map(rangeArr, (date) => ({
    scaledTime: Time.getScaledTimeByTimeScale(timeScale, date),
    count: 0
  }))

  // TODO: for zip codes, run through a zip -> state mapping. have as separate service we can eventually rm

  const upchieveRes = await request(
    `http://localhost:3000/metrics?minTime=${startDate}&maxTime=${endDate}&timeScale=${timeScale}&slugs=${slugs.join(',')}`
    , { json: true }
  )

  const metrics = _.map(upchieveRes.metrics, ({ slug, name, datapoints }) => {
    datapoints = combineArraysByKey(allDatapoints, datapoints, 'scaledTime')
    // console.log(datapoints)
    return { slug, name, datapoints }
  })

  return metrics
}

function combineArraysByKey (arr1, arr2, key) {
  arr1 = _.cloneDeep(arr1) // don't want to merge in place
  const obj2 = _.keyBy(arr2, key)
  return _.map(arr1, (value) => {
    return obj2[value[key]] || value
  })
}
