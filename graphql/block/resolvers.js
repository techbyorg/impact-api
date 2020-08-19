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
  Dashboard: {
    blocks: (dashboard, { limit }, context) => {
      return Promise.map(dashboard.blockIds, (blockId) =>
        blockLoaderFn(context).load(blockId)
      )
        .then((blocks) => _.filter(blocks, (block) => block && !block.settings?.isPrivate))
        .then(GraphqlFormatter.fromScylla)
    }
  }
}
