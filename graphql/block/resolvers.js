import { GraphqlFormatter } from 'backend-shared'

import Block from './model.js'

export default {
  Query: {
    blocks: async (rootValue, { dashboardId }) => {
      console.log('blockssss')
      return Block.getAllByDashboardId(dashboardId)
        .then(GraphqlFormatter.fromScylla)
    }
  },

  Dashboard: {
    blocks: (dashboard, { limit }) => {
      console.log('blocks', dashboard.id)
      return Block.getAllByDashboardId(dashboard.id)
        .then(GraphqlFormatter.fromScylla)
    }
  }
}
