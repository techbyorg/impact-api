import _ from 'lodash'
import { GraphqlFormatter } from 'backend-shared'

import Block from './model.js'

export default {
  Query: {
    blocks: async (rootValue, { dashboardId }) => {
      return Block.getAllByDashboardId(dashboardId)
        .then((blocks) => _.filter(blocks, ({ settings }) => !settings?.isPrivate))
        .then(GraphqlFormatter.fromScylla)
    }
  },

  Dashboard: {
    blocks: (dashboard, { limit }) => {
      return Block.getAllByDashboardId(dashboard.id)
        .then((blocks) => _.filter(blocks, ({ settings }) => !settings?.isPrivate))
        .then(GraphqlFormatter.fromScylla)
    }
  }
}
