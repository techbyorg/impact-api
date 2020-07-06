import _ from 'lodash'
import Promise from 'bluebird'
import { GraphqlFormatter, Loader, cknex } from 'backend-shared'

import Dimension from './model.js'

const dimensionLoader = Loader.withContext(async (ids, context) => {
  return Dimension.getAllByIds(_.filter(ids, (id) => id !== cknex.emptyUuid))
    .then((dimensions) => {
      dimensions = _.keyBy(dimensions, 'id')
      return _.map(ids, id => {
        return id === cknex.emptyUuid ? { id: cknex.emptyUuid, slug: 'all' } : dimensions[id]
      })
    })
})

export default {
  Metric: {
    dimensions: async (metric, args, context) => {
      const block = metric._block
      let dimensionIds = (metric.dimensionIds || []).concat(cknex.emptyUuid)
      if (block) {
        const blockDimensionIds = _.find(block.metricIds, { id: metric.id })?.dimensionIds
        if (!_.isEmpty(blockDimensionIds)) {
          dimensionIds = blockDimensionIds
        }
      }

      const dimensions = await Promise.map(dimensionIds, async (id) => {
        const dimension = await dimensionLoader(context).load(id)
        return { ...dimension, _metric: metric }
      })

      return GraphqlFormatter.fromScylla(dimensions)
    }
  }
}
