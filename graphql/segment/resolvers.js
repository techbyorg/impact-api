import { GraphqlFormatter } from 'backend-shared'

import Segment from './model.js'
import config from '../../config.js'

export default {
  Query: {
    segments: async (rootValue, { orgId, hackPw }, context) => {
      // FIXME: rm hackPw part when we have org dashboard
      if (hackPw === config.UPCHIEVE_HACK_PASS) {
        const segments = await Segment.getAllByOrgId(orgId)
        return GraphqlFormatter.fromScylla(segments)
      }
    }
  }
}
