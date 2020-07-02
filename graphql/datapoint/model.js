import { Base, cknex } from 'backend-shared'

class DatapointModel extends Base {
  getScyllaTables () {
    return [
      {
        name: 'datapoints_by_metricId_and_time',
        keyspace: 'impact',
        fields: {
          id: 'timeuuid',
          metricId: 'uuid',
          dimensionName: { type: 'text', defaultFn: () => 'all' }, // eg state, zip
          dimensionValue: { type: 'text', defaultFn: () => 'all' },
          scaledTime: { type: 'text', defaultFn: () => 'all' }, // <yyyy-mm>, <yyyy-mm-dd>, <all>, etc...
          timeBucket: { type: 'text', defaultFn: () => 'all' },
          count: 'counter'
        },
        primaryKey: {
          partitionKey: ['metricId', 'timeBucket'],
          clusteringColumns: ['scaledTime', 'dimensionName', 'dimensionValue', 'id']
        },
        withClusteringOrderBy: ['scaledTime', 'desc']
      }
    ]
  }

  getAllByMetricId (metricId) {
    return cknex().select('*')
      .from('datapoints_by_metricId')
      .where('metricId', '=', metricId)
      .run()
      .map(this.defaultOutput)
  }

  // FIXME: get by time bucket / scaledTime
  getAllByMetricIds (metricIds) {
    return cknex().select('*')
      .from('datapoints_by_metricId')
      .where('metricId', 'IN', metricIds)
      .run()
      .map(this.defaultOutput)
  }
}

export default new DatapointModel()
