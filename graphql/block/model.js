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
          dashboardId: 'uuid',
          metricIds: 'json', // [{id: <metric id>}], flexible for other settings
          teamId: 'uuid'
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
          blocks_by_dashboardId: {
            primaryKey: {
              partitionKey: ['dashboardId'],
              clusteringColumns: ['id']
            }
          }
        }
      }
    ]
  }

  getAllByDashboardId (dashboardId) {
    return cknex().select('*')
      .from('blocks_by_dashboardId')
      .where('dashboardId', '=', dashboardId)
      .run()
  }
}

export default new BlockModel()
