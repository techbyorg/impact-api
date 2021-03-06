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
  constructor () {
    super()

    this.TIME_SCALES = TIME_SCALES
  }

  getScyllaTables () {
    return [
      {
        name: 'datapoints_counter',
        keyspace: 'impact',
        fields: {
          metricId: 'uuid',
          segmentId: { type: 'uuid', defaultFn: () => cknex.emptyUuid }, // for have different dashboards per sub-org or corporate sponsor
          dimensionId: { type: 'uuid', defaultFn: () => cknex.emptyUuid }, // eg state, zip
          timeScale: { type: 'text', defaultFn: () => 'all' },
          timeBucket: { type: 'text', defaultFn: () => 'ALL:ALL' }, // see getBucketTimeScaleByScaledTime
          dimensionValue: { type: 'text', defaultFn: () => 'all' },
          scaledTime: { type: 'text', defaultFn: () => 'all' }, // <yyyy-mm>, <yyyy-mm-dd>, <all>, etc...
          count: 'counter'
        },
        primaryKey: {
          // TODO: wipe & refill data.
          // TODO: have everything insert & use timeScale to fetch
          partitionKey: ['metricId', 'segmentId', 'dimensionId', 'timeScale', 'timeBucket'],
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
    const timeScale = scaledTime.match(/([A-Z]+):/)[1]
    if (['WK', 'MON', 'YR', 'ALL'].includes(timeScale)) {
      return 'all'
    } else if (['DAY'].includes(timeScale)) {
      return 'year'
    } else { // HOUR
      return 'month'
    }
  }

  // empty string dimensionValue gets all dimensionValues
  async getAllByMetricIdAndDimensionAndTimes (metricId, segmentId, dimensionId, dimensionValue, times) {
    const { timeScale, minScaledTime, maxScaledTime } = times

    const bucketTimeScale = this.getBucketTimeScaleByScaledTime(minScaledTime)
    const timeBuckets = Time.getTimeBuckets(minScaledTime, maxScaledTime, bucketTimeScale)

    return Promise.map(timeBuckets, (timeBucket) => {
      return cknex().select('*')
        .from('datapoints_counter')
        .where('metricId', '=', metricId)
        .andWhere('segmentId', '=', segmentId)
        .andWhere('dimensionId', '=', dimensionId)
        .andWhere('timeScale', '=', timeScale)
        .andWhere('timeBucket', '=', timeBucket)
        .andWhere('scaledTime', '>=', minScaledTime)
        .andWhere('scaledTime', '<=', maxScaledTime)
        .run()
    })
      .then(_.flatten)
      .then((datapoints) => {
        if (dimensionValue) {
          datapoints = _.filter(datapoints, { dimensionValue })
        }
        return datapoints
      })
      .map(this.defaultOutput)
  }

  async get (metricId, segmentId, dimensionId, dimensionValue, timeScale, scaledTime) {
    const bucketTimeScale = this.getBucketTimeScaleByScaledTime(scaledTime)
    const time = Time.scaledTimeToUTC(scaledTime)
    const timeBucket = Time.getScaledTimeByTimeScale(bucketTimeScale, time)

    return cknex().select('*')
      .from('datapoints_counter')
      .where('metricId', '=', metricId)
      .andWhere('segmentId', '=', segmentId)
      .andWhere('dimensionId', '=', dimensionId)
      .andWhere('dimensionValue', '=', dimensionValue)
      .andWhere('timeScale', '=', timeScale)
      .andWhere('timeBucket', '=', timeBucket)
      .andWhere('scaledTime', '=', scaledTime)
      .run({ isSingle: true })
      .then(this.defaultOutput)
  }

  increment (datapoint, count = 1) {
    datapoint = _.omit(this.defaultInput(datapoint), 'count')

    return cknex().update('datapoints_counter')
      .increment('count', count)
      .where('metricId', '=', datapoint.metricId)
      .andWhere('segmentId', '=', datapoint.segmentId)
      .andWhere('dimensionId', '=', datapoint.dimensionId)
      .andWhere('timeScale', '=', datapoint.timeScale)
      .andWhere('timeBucket', '=', datapoint.timeBucket)
      .andWhere('scaledTime', '=', datapoint.scaledTime)
      .andWhere('dimensionValue', '=', datapoint.dimensionValue)
      .run()
  }

  incrementAllTimeScales (datapoint, count = 1) {
    datapoint = _.omit(this.defaultInput(datapoint), ['count', 'timeBucket'])
    const time = Time.scaledTimeToUTC(datapoint.scaledTime)
    return Promise.map(TIME_SCALES, (timeScale) => {
      const scaledTime = Time.getScaledTimeByTimeScale(timeScale, time)
      return this.increment(_.defaults({ timeScale, scaledTime }, datapoint), count)
    })
  }

  defaultInput (datapoint, options) {
    datapoint = super.defaultInput(datapoint, options)

    const bucketTimeScale = this.getBucketTimeScaleByScaledTime(datapoint.scaledTime)
    const time = Time.scaledTimeToUTC(datapoint.scaledTime)
    const timeBucket = Time.getScaledTimeByTimeScale(bucketTimeScale, time)

    return _.defaults({ timeBucket }, datapoint)
  }
}

export default new DatapointModel()
