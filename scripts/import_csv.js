/*
columns = metrics or dimensions
rows = datapoints

DIMENSIONS: receiving org, donation type (payroll / cc), employeeId

donationCount
donationSum
donationMatchSum
unique donors (uniques table), retention, etc...

days from employee join -> first donation?

avg donation size
avg # of donations per employee

// TODO: 'recurring' dimension?

amount paid by company vs by employee

*/
// FIXME: sdk should support batching so it doesn't have to look up metric, dimension, etc... each time
import _ from 'lodash'
import csv from 'csvtojson'
import Promise from 'bluebird'
import moment from 'moment-timezone'
import { init as initImpact, incrementMetric, incrementUnique } from '@techby/impact'

import { Time } from 'backend-shared'

initImpact({
  apiKey: process.env.API_KEY
});

(async () => {
  const rows = await csv.csv({
    // noheader: true,
    output: 'csv'
  }).fromFile('./scripts/rbu.csv')

  const dateIndex = 5
  const segmentSlugs = ['partner-demo']

  const dimensionIndices = [
    {
      index: 1,
      dimensionId: 'donation-type' // '9d5c66d2-e3d1-11ea-9fda-e286e4767aa1
    },
    {
      index: 9,
      dimensionId: 'donation-privacy' // '9d5c66d3-e3d1-11ea-a216-067a9306f21c
    }
  ]
  const metricIndices = [
    {
      index: -1, // count
      metricSlug: 'donations', // '9d5c18b0-e3d1-11ea-9d76-11d12d2ed70b'
      transforms: [
        { operation: 'parseInt' }
      ]
    },
    {
      index: 13,
      metricSlug: 'donation-sum', // '9d5c3fc0-e3d1-11ea-a457-ce46582889c2'
      transforms: [
        { operation: 'parseInt' }
      ]
    },
    {
      index: 14,
      metricSlug: 'donation-by-company-sum', // '9d5c66d0-e3d1-11ea-938b-c93d02a7ef5a'
      transforms: [
        { operation: 'parseInt' }
      ]
    },
    {
      index: 21,
      metricSlug: 'unique-donors', // '9d5c66d1-e3d1-11ea-988b-086f67bc7d85'
      transforms: [
        { operation: 'unique' }
      ]
    }
  ]

  const filters = [
    {
      index: 15,
      transforms: [
        { operation: 'eq', value: 'Completed' }
      ]
    }
  ]

  // FIXME: separate out uniques vs normal metrics (unique shouldn't sumby)
  const { metricValues, uniqueValues } = _.reduce(rows, (obj, row) => {
    const isFiltered = _.every(filters, ({ index, transforms }) => {
      return _.reduce(transforms, (value, transform) => {
        if (transform.operation === 'eq') {
          value = value === transform.value
        }
        return value
      }, row[index])
    })
    if (!isFiltered) {
      return obj
    }

    _.forEach(metricIndices, ({ index, metricSlug, transforms }) => {
      let count = index === -1 ? 1 : row[index]
      _.forEach(transforms, ({ operation }) => {
        if (operation === 'parseInt') {
          if (typeof count === 'string') {
            count = count.replace('$', '')
          }
          count = parseInt(count)
        }
      })
      const date = new Date(row[dateIndex])
      const scaledTime = Time.getScaledTimeByTimeScale('day', date)
      const isUnique = _.find(transforms, { operation: 'unique' })
      if (isUnique) {
        obj.uniqueValues.push({ date, metricSlug, hash: count })
      } else {
        obj.metricValues.push({ scaledTime, metricSlug, count })
      }
    })
    return obj
  }, { metricValues: [], uniqueValues: [] })

  const valuesByDay = _.groupBy(metricValues, (value) => {
    return _.values(_.omit(value, ['count'])).join(':')
  })
  const datapoints = _.map(valuesByDay, (values) => {
    const count = _.sumBy(values, 'count')
    return _.defaults({ count }, values[0])
  })

  console.log(datapoints)
  console.log(uniqueValues)

  // await Promise.map(datapoints, ({ metricSlug, scaledTime, count }, i) => {
  //   console.log(i)
  //   const date = Time.scaledTimeToUTC(scaledTime)
  //   return incrementMetric(metricSlug, {}, count, { date, segmentSlugs, isTotal: true, timeScale: 'day' })
  // }, { concurrency: 1 })

  await Promise.map(uniqueValues, ({ date, metricSlug, hash }) => {
    return incrementUnique(metricSlug, hash, { date, segmentSlugs })
  }, { concurrency: 1 })
  console.log('done')
})()
