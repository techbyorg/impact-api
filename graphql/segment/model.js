import { Base, cknex } from 'backend-shared'

class SegmentModel extends Base {
  getScyllaTables () {
    return [
      {
        name: 'segments_by_id',
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
          segments_by_orgId: {
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
      .from('segments_by_id')
      .where('id', '=', id)
      .run({ isSingle: true })
      .then(this.defaultOutput)
  }

  getAllByIds (ids) {
    return cknex().select('*')
      .from('segments_by_id')
      .where('id', 'IN', ids)
      .run()
      .map(this.defaultOutput)
  }

  getByOrgIdAndSlug (orgId, slug) {
    return cknex().select('*')
      .from('segments_by_orgId')
      .where('orgId', '=', orgId)
      .andWhere('slug', '=', slug)
      .run({ isSingle: true })
      .then(this.defaultOutput)
  }

  getAllByOrgIdAndSlugs (orgId, slugs) {
    return cknex().select('*')
      .from('segments_by_orgId')
      .where('orgId', '=', orgId)
      .andWhere('slug', 'IN', slugs)
      .run()
      .map(this.defaultOutput)
  }

  getAllByOrgId (orgId) {
    return cknex().select('*')
      .from('segments_by_orgId')
      .where('orgId', '=', orgId)
      .run()
      .map(this.defaultOutput)
  }
}

export default new SegmentModel()
