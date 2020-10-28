import { GraphqlFormatter } from 'backend-shared'

import Dashboard from './model.js'

export default {
  Query: {
    dashboards: async (rootValue, { orgId }) => {
      return Dashboard.getAllByOrgId(orgId)
        .then(GraphqlFormatter.fromScylla)
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
}
