import { Base, cknex } from 'backend-shared'

class DimensionModel extends Base {
  getScyllaTables () {
    return [
      {
        name: 'dimensions_by_slug',
        keyspace: 'impact',
        fields: {
          slug: 'text',
          id: 'timeuuid', // only used for getting creation time
          name: 'text',
          orgId: 'uuid'
        },
        primaryKey: {
          partitionKey: ['slug'],
          clusteringColumns: null
        },
        materializedViews: {
          dimensions_by_orgId: {
            primaryKey: {
              partitionKey: ['orgId'],
              clusteringColumns: ['slug']
            }
          }
        }
      }
    ]
  }

  getBySlug (slug) {
    return cknex().select('*')
      .from('dimensions_by_slug')
      .where('slug', '=', slug)
      .run({ isSingle: true })
      .then(this.defaultOutput)
  }

  getAllBySlugs (slugs) {
    return cknex().select('*')
      .from('dimensions_by_slug')
      .where('slug', 'IN', slugs)
      .run()
      .map(this.defaultOutput)
  }
}

export default new DimensionModel()
