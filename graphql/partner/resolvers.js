import { GraphqlFormatter } from 'backend-shared'

import Partner from './model.js'

export default {
  Query: {
    partners: async (rootValue, { orgId }) => {
      return []
      // return Partner.getAllByOrgId(orgId)
      //   .then(GraphqlFormatter.fromScylla)
    },

    partner: async (rootValue, { orgId, slug }) => {
      if (slug) {
        return Partner.getByOrgIdAndSlug(orgId, slug)
      } else {
        const partners = await Partner.getAllByOrgId(orgId)
        return partners[0]
      }
    }
  }
}
