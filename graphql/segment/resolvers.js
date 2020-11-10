import { GraphqlFormatter } from 'backend-shared'

import Segment from './model.js'

export default {
  Query: {
    segments: async (rootValue, { orgId }, context) => {
      // FIXME: perms
      const segments = await Segment.getAllByOrgId(orgId)
      return GraphqlFormatter.fromScylla(segments)
    }
  }
}
