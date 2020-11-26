import Block from './model.js'
import Dashboard from '../dashboard/model.js'

export default {
  Mutation: {
    blockUpsert: async (rootValue, { id, name, dashboardId, metricIds, settings, defaultPermissions }, { org, user }) => {
      const block = await Block.upsert({
        id, name, metricIds, settings, defaultPermissions
      }, { skipAdditions: Boolean(id) })
      const dashboard = await Dashboard.getById(dashboardId)
      await Dashboard.upsertByRow(dashboard, {
        blockIds: dashboard.blockIds.concat([{ id: block.id }])
      })
      return block
    }
  }
}
