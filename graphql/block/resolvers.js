import { GraphqlFormatter } from 'backend-shared'

import Block from './model.js'

export default {
  Query: {
    blocks: async (rootValue, { dashboardId }) => {
      return Block.getAllByDashboardId(dashboardId)
        .then(GraphqlFormatter.fromScylla)
    }
  },

  Dashboard: {
    blocks: (dashboard, { limit }) => {
      return Block.getAllByDashboardId(dashboard.id)
        .then(GraphqlFormatter.fromScylla)
    }
  }
}
