import Block from './model.js'

export default {
  Query: {
    blocks: async (rootValue, { teamId, dashboardId }) => {
      // TODO: get block metrics
      return []
    }
  },

  Dashboard: {
    blocks: (dashboard, { limit }) => {
      return Block.getAllByDashboardId(dashboard.id)
    }
  }
}
