import _ from 'lodash'
import { Base, cknex } from 'backend-shared'

class DashboardModel extends Base {
  getScyllaTables () {
    return [
      {
        name: 'partners_by_id',
        keyspace: 'impact',
        fields: {
          id: 'timeuuid',
          slug: 'text',
          name: 'text',
          segmentId: 'uuid',
          dashboardIds: 'json', // [{id: <dashboard id>}], flexible for other settings
          orgId: 'uuid'
        },
        primaryKey: {
          partitionKey: ['id'],
          clusteringColumns: ['orgId']
        },
        materializedViews: {
          partners_by_orgId_and_slug: {
            primaryKey: {
              partitionKey: ['orgId'],
              clusteringColumns: ['slug', 'id']
            }
          }
        }
      }
    ]
  }

  async getAllByOrgId (orgId) {
    return cknex().select('*')
      .from('partners_by_orgId_and_slug')
      .where('orgId', '=', orgId)
      .run()
      .map(this.defaultOutput)
      .then((partners) => {
        return _.orderBy(partners, 'displayOrder', 'asc')
      })
  }

  getByOrgIdAndSlug (orgId, slug) {
    return cknex().select('*')
      .from('partners_by_orgId_and_slug')
      .where('orgId', '=', orgId)
      .andWhere('slug', '=', slug)
      .run({ isSingle: true })
      .then(this.defaultOutput)
  }
}

export default new DashboardModel()
