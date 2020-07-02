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
          orgId: 'uuid'
        },
        primaryKey: {
          partitionKey: ['id'],
          clusteringColumns: null
        },
        materializedViews: {
          metrics_by_orgId: {
            primaryKey: {
              partitionKey: ['orgId'],
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
      .then(this.defaultOutput)
  }

  getAllByIds (ids) {
    return cknex().select('*')
      .from('metrics_by_id')
      .where('id', 'IN', ids)
      .run()
      .map(this.defaultOutput)
  }
}

export default new MetricModel()
