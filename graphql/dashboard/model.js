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
          name: 'text',
          orgId: 'uuid'
        },
        primaryKey: {
          partitionKey: ['id'],
          clusteringColumns: ['orgId']
        },
        materializedViews: {
          dashboards_by_orgId_and_slug: {
            primaryKey: {
              partitionKey: ['orgId'],
              clusteringColumns: ['slug', 'id']
            }
          }
        }
      }
    ]
  }

  getAllByOrgId (orgId) {
    return cknex().select('*')
      .from('dashboards_by_orgId_and_slug')
      .where('orgId', '=', orgId)
      .run()
      .map(this.defaultOutput)
  }

  getByOrgIdAndSlug (orgId, slug) {
    return cknex().select('*')
      .from('dashboards_by_orgId_and_slug')
      .where('orgId', '=', orgId)
      .andWhere('slug', '=', slug)
      .run({ isSingle: true })
      .then(this.defaultOutput)
  }
}

export default new BlockModel()
