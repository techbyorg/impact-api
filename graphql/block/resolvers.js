import _ from 'lodash'
import Promise from 'bluebird'
import { GraphqlFormatter, Loader } from 'backend-shared'

import Block from './model.js'

const blockLoaderFn = Loader.withContext(async (ids, context) => {
  console.log('load', ids)
  return Block.getAllByIds(ids)
    .then((blocks) => {
      blocks = _.keyBy(blocks, 'id')
      return _.map(ids, id => blocks[id])
    })
})

export default {
  Dashboard: {
    blocks: async (dashboard, { limit }, context) => {
      let blocks = await Promise.map(dashboard.blockIds, ({ id }) =>
        blockLoaderFn(context).load(id)
      )
      blocks = _.zipWith(blocks, dashboard.blockIds, (block, { sectionIndex }) =>
        block && _.defaults({ sectionIndex }, block)
      )
      blocks = _.filter(blocks, (block) => block && !block.settings?.isPrivate)
      return GraphqlFormatter.fromScylla(blocks)
    }
  }
}
