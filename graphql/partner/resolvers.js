import { GraphqlFormatter } from 'backend-shared'

import Partner from './model.js'
import config from '../../config.js'

export default {
  Query: {
    partners: async (rootValue, { orgId, hackPw }) => {
      // FIXME: rm hackPw part when we have org dashboard
      return []
      // if (hackPw === config.UPCHIEVE_HACK_PASS) {
      //   return Partner.getAllByOrgId(orgId)
      //     .then(GraphqlFormatter.fromScylla)
      // }
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
