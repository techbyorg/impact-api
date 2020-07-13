import _ from 'lodash'
import Promise from 'bluebird'
import { Base, cknex, Time } from 'backend-shared'

/*
  aggregated anonymous data
  weaknesses: cannot get data on combination of dimensions.
  eg. # of pageviews (metric) from Austin, TX (dim1) that use Firefox (dim2)
  can only get # of pageviews from Austin, TX and # of pageviews that use Firefox
*/

const TIME_SCALES = ['all', 'year', 'month', 'week', 'day']

class DatapointModel extends Base {
  TIME_SCALES = TIME_SCALES

  getScyllaTables () {
    return [
      {
        name: 'datapoints_counter',
        keyspace: 'impact',
        fields: {
          metricId: 'uuid',
          dimensionId: { type: 'uuid', defaultFn: () => cknex.emptyUuid }, // eg state, zip
          dimensionValue: { type: 'text', defaultFn: () => 'all' },
          scaledTime: { type: 'text', defaultFn: () => 'all' }, // <yyyy-mm>, <yyyy-mm-dd>, <all>, etc...
          timeBucket: { type: 'text', defaultFn: () => 'all' }, // see getBucketTimeScaleByScaledTime
          count: 'counter'
        },
        primaryKey: {
          partitionKey: ['metricId', 'dimensionId', 'timeBucket'],
          clusteringColumns: ['scaledTime', 'dimensionValue']
        },
        withClusteringOrderBy: ['scaledTime', 'desc']
      }
    ]
  }

  // can do ~1,000,000 rows before we're too large per partition
  // (https://cql-calculator.herokuapp.com/)

  // scaledTimes that are week, month, year, all are in 'all' bucket
  // (over 10 years that's just 651 rows per dimensionValue, good for avg 1k dimensionValues)

  // scaledTimes that are day are in YR-YYYY bucket
  // 365 per dimension

  // scaledTimes that are hour are in MON-YYYY-MM bucket
  // 720 per dimension
  getBucketTimeScaleByScaledTime (scaledTime) {
    if (scaledTime === 'ALL') {
      return 'all'
    }
    const timeScale = scaledTime.match(/([A-Z]+):/)[1]
    if (['WK', 'MON', 'YR', 'ALL'].includes(timeScale)) {
      return 'all'
    } else if (['DAY'].includes(timeScale)) {
      return 'year'
    } else { // HOUR
      return 'month'
    }
  }

  async getAllByMetricIdAndDimensionIdAndTimes (metricId, dimensionId, times) {
    const { minScaledTime, maxScaledTime } = times

    const bucketTimeScale = this.getBucketTimeScaleByScaledTime(minScaledTime)
    const timeBuckets = Time.getTimeBuckets(minScaledTime, maxScaledTime, bucketTimeScale)

    return Promise.map(timeBuckets, (timeBucket) => {
      return cknex().select('*')
        .from('datapoints_counter')
        .where('metricId', '=', metricId)
        .andWhere('dimensionId', '=', dimensionId)
        .andWhere('timeBucket', '=', timeBucket)
        .andWhere('scaledTime', '>=', minScaledTime)
        .andWhere('scaledTime', '<=', maxScaledTime)
        .run()
    })
      .then(_.flatten)
      .map(this.defaultOutput)
  }

  increment (datapoint, count = 1) {
    datapoint = _.omit(this.defaultInput(datapoint), 'count')

    console.log('inc', datapoint)

    let timeBucket = datapoint.timeBucket
    if (!timeBucket) {
      const time = Time.scaledTimeToUTC(datapoint.scaledTime)
      const bucketTimeScale = this.getBucketTimeScaleByScaledTime(datapoint.scaledTime)
      timeBucket = Time.getScaledTimeByTimeScale(bucketTimeScale, time)
    }

    cknex().update('datapoints_counter')
      .increment('count', count)
      .where('metricId', '=', datapoint.metricId)
      .andWhere('dimensionId', '=', datapoint.dimensionId)
      .andWhere('timeBucket', '=', timeBucket)
      .andWhere('scaledTime', '=', datapoint.scaledTime)
      .andWhere('dimensionValue', '=', datapoint.dimensionValue)
      .run()
  }

  incrementAllTimeScales (datapoint, count) {
    datapoint = _.omit(this.defaultInput(datapoint), ['count', 'timeBucket'])
    const time = Time.scaledTimeToUTC(datapoint.scaledTime)
    Promise.map(TIME_SCALES, (timeScale) => {
      const scaledTime = Time.getScaledTimeByTimeScale(timeScale, time)
      this.increment(_.defaults({ scaledTime }, datapoint), count)
    })
  }

  defaultInput (datapoint, options) {
    datapoint = super.defaultInput(datapoint, options)

    const timeScale = this.getBucketTimeScaleByScaledTime(datapoint.scaledTime)
    const time = Time.scaledTimeToUTC(datapoint.scaledTime)
    const timeBucket = Time.getScaledTimeByTimeScale(timeScale, time)

    return _.defaults({ timeBucket }, datapoint)
  }
}

export default new DatapointModel()
