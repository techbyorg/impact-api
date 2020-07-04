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
      let metrics = await Promise.map(
        block.metricIds,
        ({ id }) => metricLoader(context).load(id)
      )

      metrics = _.map(metrics, (metric) => ({ ...metric, _block: block }))
      return GraphqlFormatter.fromScylla(metrics)
    }
  }
}
