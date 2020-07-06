import { Base, cknex } from 'backend-shared'

class DimensionModel extends Base {
  getScyllaTables () {
    return [
      {
        name: 'dimensions_by_id',
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
          dimensions_by_orgId: {
            primaryKey: {
              partitionKey: ['orgId'],
              clusteringColumns: ['slug', 'id']
            }
          }
        }
      }
    ]
  }

  getById (id) {
    return cknex().select('*')
      .from('dimensions_by_id')
      .where('id', '=', id)
      .run({ isSingle: true })
      .then(this.defaultOutput)
  }

  getAllByIds (ids) {
    return cknex().select('*')
      .from('dimensions_by_id')
      .where('id', 'IN', ids)
      .run()
      .map(this.defaultOutput)
  }

  getByOrgIdAndSlug (orgId, slug) {
    return cknex().select('*')
      .from('dimensions_by_orgId')
      .where('orgId', '=', orgId)
      .andWhere('slug', '=', slug)
      .run({ isSingle: true })
      .then(this.defaultOutput)
  }

  getAllByOrgIdAndSlugs (orgId, slugs) {
    return cknex().select('*')
      .from('dimensions_by_orgId')
      .where('orgId', '=', orgId)
      .andWhere('slug', 'IN', slugs)
      .run()
      .map(this.defaultOutput)
  }
}

export default new DimensionModel()
