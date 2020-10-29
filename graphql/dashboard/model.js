import _ from 'lodash'
import { Base, cknex } from 'backend-shared'

class DashboardModel extends Base {
  getScyllaTables () {
    return [
      {
        name: 'dashboards_by_id',
        keyspace: 'impact',
        fields: {
          id: 'timeuuid',
          slug: 'text',
          name: 'text',
          sections: 'json', // [{name: <text>}]
          blockIds: 'json', // [{id: <block id>, sectionIndex: <index>}], flexible for other settings
          settings: 'json', // { isPrivate }
          orgId: 'uuid',
          displayOrder: 'int'
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

  async getAllByOrgId (orgId) {
    return cknex().select('*')
      .from('dashboards_by_orgId_and_slug')
      .where('orgId', '=', orgId)
      .run()
      .map(this.defaultOutput)
      .then((dashboards) => {
        return _.orderBy(dashboards, 'displayOrder', 'asc')
      })
  }

  getByOrgIdAndSlug (orgId, slug) {
    return cknex().select('*')
      .from('dashboards_by_orgId_and_slug')
      .where('orgId', '=', orgId)
      .andWhere('slug', '=', slug)
      .run({ isSingle: true })
      .then(this.defaultOutput)
  }

  getById (id) {
    return cknex().select('*')
      .from('dashboards_by_id')
      .where('id', '=', id)
      .run({ isSingle: true })
      .then(this.defaultOutput)
  }
}

export default new DashboardModel()
