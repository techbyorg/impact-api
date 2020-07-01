import { Base, cknex } from 'backend-shared'

class BlockModel extends Base {
  getScyllaTables () {
    return [
      {
        name: 'dashboards_by_id',
        keyspace: 'impact',
        fields: {
          id: 'timeuuid',
          slug: 'text',
          teamId: 'uuid'
        },
        primaryKey: {
          partitionKey: ['id'],
          clusteringColumns: null
        },
        materializedViews: {
          dashboards_by_slug: {
            primaryKey: {
              partitionKey: ['slug'],
              clusteringColumns: ['id']
            }
          },
          dashboards_by_teamId: {
            primaryKey: {
              partitionKey: ['teamId'],
              clusteringColumns: ['id']
            }
          }
        }
      }
    ]
  }

  getAllByTeamId (teamId) {
    return cknex().select('*')
      .from('dashboards_by_teamId')
      .where('teamId', '=', teamId)
      .run()
  }
}

export default new BlockModel()
