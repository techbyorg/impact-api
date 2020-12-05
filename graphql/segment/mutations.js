import _ from 'lodash'

import Segment from './model.js'

export default {
  Mutation: {
    segmentUpsert: async (rootValue, { id, slug, name }, { org, user }) => {
      const diff = { id, slug, name, orgId: org.id }

      if (!id) {
        const getBySlug = (slug) => {
          return Segment.getByOrgIdAndSlug(org.id, slug)
        }
        diff.slug = await Segment.getUniqueSlug(_.kebabCase('New segment'), { getBySlug })
      }
      return Segment.upsert(diff, { skipAdditions: Boolean(id) })
    },

    segmentDeleteById: async (rootValue, { id }, { org, user }) => {
      const segment = await Segment.getById(id)
      console.log('delete', segment)
      Segment.deleteByRow(segment)
    }
  }
}
