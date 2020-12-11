import { Base, cknex } from 'backend-shared'

class MetricModel extends Base {
  getScyllaTables () {
    return [
      {
        name: 'metrics_by_id',
        keyspace: 'impact',
        fields: {
          id: 'timeuuid',
          slug: 'text',
          name: 'text',
          orgId: 'uuid',
          unit: { type: 'text', defaultFn: () => 'custom' }, // seconds, minutes, hours, dollars, etc...
          type: { type: 'text', defaultFn: () => 'standard' }, // standard | derived
          // for derived metrics. derived at READ time
          transforms: { type: 'json', defaultFn: () => [] },
          firstDatapointTime: 'date', // used for 'all time'
          // cannot use set here
          // `WHERE orgId=<orgId> AND slug IN <slugs>` gives Cannot restrict clustering columns by IN relations when a collection is selected by the query
          // https://github.com/scylladb/scylla/issues/4251 (though I don't think they pegged issue properly)
          // might just be intentional though https://stackoverflow.com/questions/43580321/cannot-restrict-clustering-columns-by-in-relations-when-a-collection-is-selected?rq=1#comment74210466_43580321
          // dimensionIds: { type: 'set', subType: 'uuid', defaultFn: () => [] }
          dimensionIds: { type: 'json', defaultFn: () => [] } // [<dimensionId>]

        },
        primaryKey: {
          partitionKey: ['id'],
          clusteringColumns: ['orgId']
        },
        materializedViews: {
          metrics_by_orgId_and_slug: {
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
      .from('metrics_by_id')
      .where('id', '=', id)
      .run({ isSingle: true })
      .then(this.defaultOutput)
  }

  getAllByIds (ids) {
    return cknex().select('*')
      .from('metrics_by_id')
      .where('id', 'IN', ids)
      .run()
      .map(this.defaultOutput)
  }

  getAllByOrgId (orgId) {
    return cknex().select('*')
      .from('metrics_by_orgId_and_slug')
      .where('orgId', '=', orgId)
      .run()
      .map(this.defaultOutput)
  }

  getByOrgIdAndSlug (orgId, slug) {
    return cknex().select('*')
      .from('metrics_by_orgId_and_slug')
      .where('orgId', '=', orgId)
      .andWhere('slug', '=', slug)
      .run({ isSingle: true })
      .then(this.defaultOutput)
  }

  getAllByOrgIdAndSlugs (orgId, slugs) {
    return cknex().select('*')
      .from('metrics_by_orgId_and_slug')
      .where('orgId', '=', orgId)
      .andWhere('slug', 'IN', slugs)
      .run()
      .map(this.defaultOutput)
  }
}

export default new MetricModel()
