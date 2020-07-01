import _ from 'lodash'
import request from 'request-promise'
import Moment from 'moment'
import momentRange from 'moment-range'
import { Time } from 'backend-shared'

import Metric from './model.js'

const { extendMoment } = momentRange
const moment = extendMoment(Moment)

export default {
  Query: {
    metrics: async (rootValue, { teamId, startDate, endDate, timeScale = 'day' }) => {
      // FIXME: pull from upchieve for now
      console.log('metr', startDate, endDate)

      console.log(startDate, endDate)

      const range = moment.range(
        Time.dateToUTC(new Date(startDate)),
        Time.dateToUTC(new Date(endDate))
      )
      console.log('got range')
      const rangeArr = Array.from(range.by(timeScale))
      console.log('range arr')
      const allDatapoints = _.map(rangeArr, (date) => ({
        scaledTime: Time.getScaledTimeByTimeScale(timeScale, date),
        value: 0
      }))

      console.log('get...')

      const upchieveRes = await request(
        `http://localhost:3000/metrics?minTime=${startDate}&maxTime=${endDate}&timeScale=${timeScale}`
        , { json: true }
      )

      console.log('m', JSON.stringify(upchieveRes.metrics, null, 2))

      const metrics = _.map(upchieveRes.metrics, ({ slug, name, datapoints }) => {
        datapoints = combineArraysByKey(allDatapoints, datapoints, 'scaledTime')
        // console.log(datapoints)
        return { slug, name, datapoints }
      })

      return { nodes: metrics }
    }
  },

  Block: {
    metrics: async (block) => {
      // TODO: get all metrics w/ a loader
      // maybe pass in separate loader for getting all datapoints?
      const metric = await Metric.getById(block.metricIds[0].id)
      if (metric) {
        return [metric]
      }
    }
  }
}

function combineArraysByKey (arr1, arr2, key) {
  arr1 = _.cloneDeep(arr1) // don't want to merge in place
  const obj2 = _.keyBy(arr2, key)
  return _.map(arr1, (value) => {
    return obj2[value[key]] || value
  })
}
