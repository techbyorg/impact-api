import Datapoint from '../model'

export default {
  Metric: {
    datapoints: async (metric, { limit }) => {
      Datapoint.getAllByMetricId(metric.id)
    }
  }
}
