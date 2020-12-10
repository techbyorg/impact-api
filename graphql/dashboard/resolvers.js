import { GraphqlFormatter, Permission } from 'backend-shared'

import Dashboard from './model.js'

export default {
  Query: {
    dashboards: async (rootValue, { orgId }, { org }) => {
      orgId = orgId || org.id
      const dashboards = await Dashboard.getAllByOrgId(orgId)
      return GraphqlFormatter.fromScylla(dashboards)
    },

    dashboard: async (rootValue, { id, orgId, slug }, { org }) => {
      orgId = orgId || org.id
      if (id) {
        return Dashboard.getById(id)
      } else if (slug) {
        return Dashboard.getByOrgIdAndSlug(orgId, slug)
      } else {
        let dashboards = await Dashboard.getAllByOrgId(orgId)
        dashboards = await Permission.filterByOrgUser({
          sourceModels: dashboards, orgUser: org.orgUser, sourceType: 'impact-dashboard', permissions: ['view']
        })
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
