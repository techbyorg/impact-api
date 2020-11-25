import _ from 'lodash'
import { GraphqlFormatter, Permission } from 'backend-shared'

import Segment from './model.js'

export default {
  Query: {
    segment: async (rootValue, { slug }, { org }) => {
      // FIXME: perms
      return Segment.getByOrgIdAndSlug(org.id, slug)
    },

    segments: async (rootValue, args, { org }) => {
      // TODO: more focused perm (this is just edit dash perm)
      const hasViewAllSegmentsPermission = Permission.hasPermission({
        sourceType: 'dashboard', sourceModel: null, permissions: ['edit'], orgUser: org.orgUser
      })
      const segmentIds = _.flatten(_.map(org.orgUser.partners?.nodes, ({ data }) => {
        return data.impact.segmentIds
      }))
      const allSegments = await Segment.getAllByOrgId(org.id)
      const segments = _.filter(allSegments, (segment) =>
        hasViewAllSegmentsPermission || segmentIds.includes(segment.id)
      )
      return GraphqlFormatter.fromScylla(segments)
    }
  }
}
