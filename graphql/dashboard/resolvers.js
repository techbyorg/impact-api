import _ from 'lodash'
import { GraphqlFormatter } from 'backend-shared'

import Dashboard from './model.js'

export default {
  Query: {
    dashboards: async (rootValue, { orgId }) => {
      let dashboards = await Dashboard.getAllByOrgId(orgId)
      dashboards = _.filter(dashboards, (dashboard) => dashboard && !dashboard.settings?.isPrivate)
      return GraphqlFormatter.fromScylla(dashboards)
    },

    dashboard: async (rootValue, { id, orgId, slug }) => {
      if (id) {
        return Dashboard.getById(id)
      } else if (slug) {
        return Dashboard.getByOrgIdAndSlug(orgId, slug)
      } else {
        const dashboards = await Dashboard.getAllByOrgId(orgId)
        return dashboards[0]
      }
    }
  }

  // Dashboard: {
  //   mePermissions: async (dashboard, args, context) => {
  //     console.log('dash', dashboard)
  //     OrgUser.hasPermissionByOrgIdAndUser
  //   }
  // }
}
