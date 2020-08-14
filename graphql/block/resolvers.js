import _ from 'lodash'
import { GraphqlFormatter } from 'backend-shared'

import Block from './model.js'
import config from '../../config.js'

export default {
  Query: {
    blocks: async (rootValue, { dashboardId, hackPw }) => {
      return Block.getAllByDashboardId(dashboardId)
        .then((blocks) => {
          if (hackPw === config.UPCHIEVE_HACK_PASS) {
            return blocks
          } else {
            return _.filter(blocks, ({ settings }) => !settings?.isPrivate)
          }
        })
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
