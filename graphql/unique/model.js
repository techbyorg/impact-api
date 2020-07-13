import { Base, cknex } from 'backend-shared'

// required for stuff like DAU, WAU, MAU and retention
class UniqueModel extends Base {
  getScyllaTables () {
    return [
      {
        name: 'uniques_by_metricId_and_hash',
        keyspace: 'impact',
        fields: {
          metricId: 'uuid',
          dimensionId: { type: 'uuid', defaultFn: () => cknex.emptyUuid }, // eg state, zip
          dimensionValue: { type: 'text', defaultFn: () => 'all' },
          scaledTime: 'text',
          hash: 'text',
          addTime: { type: 'timestamp', defaultFn: Date }
        },
        // hopefully we won't ever need to delete all rows for a metric or org.
        // to do so we'd have to make a materialized view on metricId+scaledTime.
        // not doing it ahead of time, because it'd be easy for a partition to get
        // 100mb+ w/ 2-3 million hashes
        primaryKey: {
          partitionKey: ['metricId', 'dimensionId', 'dimensionValue', 'hash'],
          clusteringColumns: ['scaledTime']
        }
      }
    ]
  }

  getAll ({ metricId, dimensionId, dimensionValue, hash, scaledTimes }) {
    dimensionId = dimensionId || cknex.emptyUuid
    dimensionValue = dimensionValue || 'all'
    return cknex().select('*')
      .from('uniques_by_metricId_and_hash')
      .where('metricId', '=', metricId)
      .andWhere('dimensionId', '=', dimensionId)
      .andWhere('dimensionValue', '=', dimensionValue)
      .andWhere('hash', '=', hash)
      .andWhere('scaledTime', 'IN', scaledTimes)
      .run()
      .map(this.defaultOutput)
  }

  get ({ metricId, dimensionId, dimensionValue, hash, scaledTime }) {
    dimensionId = dimensionId || cknex.emptyUuid
    dimensionValue = dimensionValue || 'all'
    return cknex().select('*')
      .from('uniques_by_metricId_and_hash')
      .where('metricId', '=', metricId)
      .andWhere('dimensionId', '=', dimensionId)
      .andWhere('dimensionValue', '=', dimensionValue)
      .andWhere('hash', '=', hash)
      .andWhere('scaledTime', '=', scaledTime)
      .run({ isSingle: true })
      .then(this.defaultOutput)
  }
}

export default new UniqueModel()
