import { GraphqlFormatter } from 'backend-shared'

import Dashboard from './model.js'

export default {
  Query: {
    dashboards: async (rootValue, { orgId }) => {
      return Dashboard.getAllByOrgId(orgId)
        .then(GraphqlFormatter.fromScylla)
    },

    dashboard: async (rootValue, { orgId, slug }) => {
      return Dashboard.getByOrgIdAndSlug(orgId, slug)
    }
  }
}
