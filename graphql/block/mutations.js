import Block from './model.js'
import Dashboard from '../dashboard/model.js'

export default {
  Mutation: {
    blockUpsert: async (rootValue, { id, name, dashboardId, metricIds, settings }, { org, user }) => {
      const block = await Block.upsert({
        id, name, metricIds, settings
      }, { skipAdditions: Boolean(id) })
      const dashboard = await Dashboard.getById(dashboardId)
      await Dashboard.upsertByRow(dashboard, {
        blockIds: dashboard.blockIds.concat([{ id: block.id }])
      })
      return block
    }
  }
}
