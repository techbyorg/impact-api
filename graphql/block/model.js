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
          orgId: 'uuid',
          settings: 'json'
          // TODO: way to perform transforms on data. eg line chart of metric x divided by metric y
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
      .map(this.defaultOutput)
  }
}

export default new BlockModel()
