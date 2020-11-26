import _ from 'lodash'

import Dashboard from './model.js'

export default {
  Mutation: {
    dashboardUpsert: async (rootValue, { id, name, defaultPermissions }, { org, user }) => {
      const diff = { id, name, defaultPermissions, orgId: org.id }
      if (!id) {
        const getBySlug = (slug) => Dashboard.getByOrgIdAndSlug(org.id, slug)
        diff.slug = await Dashboard.getUniqueSlug(_.kebabCase(name), { getBySlug })
      }
      return Dashboard.upsert(diff, { skipAdditions: Boolean(id) })
    }
  }
}
