import _ from 'lodash'
import Promise from 'bluebird'
import { GraphqlFormatter, Loader } from 'backend-shared'

import Block from './model.js'

const blockLoaderFn = Loader.withContext(async (ids, context) => {
  return Block.getAllByIds(ids)
    .then((blocks) => {
      blocks = _.keyBy(blocks, 'id')
      return _.map(ids, id => blocks[id])
    })
})

export default {
  Query: {
    block: async (rootValue, { id, type, metricIds }, { org, user }) => {
      const block = await Block.getById(id)
      console.log('get...', type, metricIds)
      if (type && block.settings) { // for preview
        block.settings.type = type
      }
      if (!_.isEmpty(metricIds)) {
        block.metricIds = metricIds
      }
      return block
    }
  },
  Dashboard: {
    blocks: async (dashboard, { limit }, context) => {
      // FIXME: some perms stuff should be directives...
      // @hasPermissions(sourceType: global)
      // a lot will still have to be in code too. eg check if can view private blocks
      // (won't know it's a private block until it has been fetched)

      let blocks = await Promise.map(dashboard.blockIds, ({ id }) =>
        blockLoaderFn(context).load(id)
      )
      blocks = _.filter(_.zipWith(blocks, dashboard.blockIds, (block, { sectionIndex }) =>
        block && _.defaults({ sectionIndex }, block)
      ))

      return GraphqlFormatter.fromScylla(blocks)
    }
  }
}
