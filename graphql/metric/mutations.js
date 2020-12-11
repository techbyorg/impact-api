import Metric from './model.js'

export default {
  Mutation: {
    metricUpsert: async (rootValue, { id, name, unit, transforms }, { org, user }) => {
      return Metric.upsert({
        id, orgId: org.id, name, unit, transforms
      }, { skipAdditions: Boolean(id) })
    },

    metricDeleteById: async (rootValue, { id }, { org, user }) => {
      const metric = await Metric.getById(id)
      console.log('delete', metric)
      Metric.deleteByRow(metric)
    }
  }
}
