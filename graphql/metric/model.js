import { Base, cknex } from 'backend-shared'

class MetricModel extends Base {
  getScyllaTables () {
    return [
      {
        name: 'metrics_by_id',
        keyspace: 'impact',
        fields: {
          id: 'timeuuid',
          slug: 'text',
          name: 'text',
          teamId: 'uuid'
        },
        primaryKey: {
          partitionKey: ['id'],
          clusteringColumns: null
        },
        materializedViews: {
          metrics_by_teamId: {
            primaryKey: {
              partitionKey: ['teamId'],
              clusteringColumns: ['id']
            }
          }
        }
      }
    ]
  }

  getById (id) {
    return cknex().select('*')
      .from('metrics_by_id')
      .where('id', '=', id)
      .run({ isSingle: true })
  }
}

export default new MetricModel()
