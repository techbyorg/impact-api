import _ from 'lodash'
import Promise from 'bluebird'
import { GraphqlFormatter, Loader, Permission } from 'backend-shared'

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
    block: async (rootValue, { id }, { org, user }) => {
      return Block.getById(id)
    }
  },
  Dashboard: {
    blocks: async (dashboard, { limit }, context) => {
      const { org } = context

      // FIXME: some perms stuff should be directives...
      // @hasPermissions(sourceType: global)
      // a lot will still have to be in code too. eg check if can view private blocks
      // (won't know it's a private block until it has been fetched)

      // const hasViewPrivateBlockPermission = OrgUser.hasPermissionByOrgIdAndUser(
      //   dashboard.orgId, user, ['view']
      // )
      let blocks = await Promise.map(dashboard.blockIds, ({ id }) =>
        blockLoaderFn(context).load(id)
      )
      blocks = _.zipWith(blocks, dashboard.blockIds, (block, { sectionIndex }) =>
        block && _.defaults({ sectionIndex }, block)
      )

      blocks = await Permission.filterByOrgUser({
        models: blocks, orgUser: org.orgUser, sourceType: 'block', permissions: ['view']
      })

      return GraphqlFormatter.fromScylla(blocks)
    }
  }
}
