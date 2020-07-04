import _ from 'lodash'
import Promise from 'bluebird'
import { GraphqlFormatter, Loader } from 'backend-shared'

import Dimension from './model.js'

const dimensionLoader = Loader.withContext(async (slugs, context) => {
  return Dimension.getAllBySlugs(_.filter(slugs, (slug) => slug !== 'all'))
    .then((dimensions) => {
      dimensions = _.keyBy(dimensions, 'slug')
      return _.map(slugs, slug =>
        slug === 'all' ? { slug: 'all' } : { slug } // FIXME: add upchieve dimensions: dimensions[slug]
      )
    })
})

export default {
  Metric: {
    dimensions: async (metric, args, context) => {
      const block = metric._block
      let dimensionSlugs = (metric.dimensionSlugs || []).concat('all')
      if (block) {
        const blockDimensionSlugs = _.find(block.metricIds, { id: metric.id })?.dimensionSlugs
        if (blockDimensionSlugs) {
          dimensionSlugs = blockDimensionSlugs
        }
      }
      let dimensions = await Promise.map(
        dimensionSlugs, (slug) => dimensionLoader(context).load(slug)
      )

      dimensions = _.map(dimensions, (dimension) => ({ ...dimension, _metric: metric }))
      return GraphqlFormatter.fromScylla(dimensions)
    }
  }
}
