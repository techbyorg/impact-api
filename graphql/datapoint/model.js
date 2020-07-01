import { Base, cknex } from 'backend-shared'

class DatapointModel extends Base {
  getScyllaTables () {
    return [
      {
        name: 'datapoints_by_metricId',
        keyspace: 'impact',
        fields: {
          id: 'timeuuid',
          metricId: 'uuid',
          value: 'json', // TODO
          scaledTime: 'text', // <yyyy-mm>, <yyyy-mm-dd>, etc...
          timeBucket: 'text'
        },
        primaryKey: {
          partitionKey: ['metricId', 'timeBucket'],
          clusteringColumns: ['scaledTime']
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
  }

  // FIXME: get by time bucket / scaledTime
  getAllByMetricIds (metricIds) {
    return cknex().select('*')
      .from('datapoints_by_metricId')
      .where('metricId', 'IN', metricIds)
      .run()
  }
}

export default new DatapointModel()
