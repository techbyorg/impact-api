import { Base, cknex } from 'backend-shared'

class BlockModel extends Base {
  getScyllaTables () {
    return [
      {
        name: 'blocks_by_id',
        keyspace: 'impact',
        fields: {
          id: 'timeuuid',
          slug: 'text',
          name: 'text',
          metricIds: 'json', // [{id: <metric id>}], flexible for other settings
          orgId: 'uuid',
          settings: 'json'
        },
        primaryKey: {
          partitionKey: ['id'],
          clusteringColumns: null
        },
        materializedViews: {
          blocks_by_slug: {
            primaryKey: {
              partitionKey: ['slug'],
              clusteringColumns: ['id']
            }
          },
          blocks_by_orgId: {
            primaryKey: {
              partitionKey: ['orgId'],
              clusteringColumns: ['id']
            }
          }
        }
      }
    ]
  }

  getAllByIds (ids) {
    return cknex().select('*')
      .from('blocks_by_id')
      .where('id', 'IN', ids)
      .run()
      .map(this.defaultOutput)
  }

  getById (id) {
    return cknex().select('*')
      .from('blocks_by_id')
      .where('id', '=', id)
      .run({ isSingle: true })
      .then(this.defaultOutput)
  }
}

export default new BlockModel()
