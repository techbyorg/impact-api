import _ from 'lodash'
import Promise from 'bluebird'
import { GraphqlFormatter, Loader } from 'backend-shared'

import Metric from './model.js'

const metricLoader = Loader.withContext(async (ids, context) => {
  return Metric.getAllByIds(ids)
    .then((metrics) => {
      metrics = _.keyBy(metrics, 'id')
      return _.map(ids, id => metrics[id])
    })
})

export default {
  Block: {
    metrics: async (block, args, context) => {
      // TODO: get all metrics w/ a loader
      // maybe pass in separate loader for getting all datapoints?
      console.log('mbbb', block.metricIds)
      let metrics = await Promise.map(
        block.metricIds,
        ({ id }) => metricLoader(context).load(id)
      )

      // FIXME: this is getting set on wrong metric if metric is in 2 blocks
      metrics = _.map(metrics, (metric) => ({ ...metric, _block: block }))
      console.log('mm', metrics)
      return GraphqlFormatter.fromScylla(metrics)
    }
  }
}
