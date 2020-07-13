import { cknex } from 'backend-shared'

import Dashboard from '../graphql/dashboard/model.js'
import Dimension from '../graphql/dimension/model.js'
import Metric from '../graphql/metric/model.js'
import Block from '../graphql/block/model.js'
import { setup } from '../services/setup.js'
import config from '../config'

setup().then(() => {
  console.log(`${cknex.getTimeUuidStr()}`)

  const ORG_ID = 'c98708d0-c3ad-11ea-a25b-49d5a57b8b87'

  const dashboards = [
    {
      id: 'd9031d80-c3ad-11ea-bac1-bc3c2083c245',
      slug: 'slack',
      name: 'Slack',
      orgId: ORG_ID
    }
  ]

  const metrics = [
    {
      id: '86a70f90-c3af-11ea-adb1-8ca034704bbf',
      slug: 'messages',
      name: 'Messages',
      dimensionIds: ['9ee21050-c3af-11ea-9005-0167d883fd11'],
      orgId: ORG_ID
    },
    {
      id: '26036350-c477-11ea-a055-be04b2e9fbcc',
      slug: 'active-users',
      name: 'Active users',
      orgId: ORG_ID
    }
    // {
    //   id: '',
    //   slug: 'avg-session-duration',
    //   name: 'Avg session duration',
    //   unit: 'second',
    //   orgId: ORG_ID,
    //   type: 'derived',
    //   transforms: [
    //     {
    //       operation: 'base',
    //       metricId: ''
    //     },
    //     {
    //       operation: '/',
    //       metricId: ''
    //     }
    //   ]
    // }
  ]

  const dimensions = [
    {
      id: config.RETENTION_DIMENSION_UUID,
      slug: 'retention',
      orgId: cknex.emptyUuid
    },
    {
      id: '9ee21050-c3af-11ea-9005-0167d883fd11',
      slug: 'channel-name',
      orgId: ORG_ID
    },
    {
      id: '9ee21050-c3af-11ea-9005-0167d883fd11',
      slug: 'channel-name',
      orgId: ORG_ID
    },
    {
      id: '3f2965f0-c3eb-11ea-9e02-553ec07262ef',
      slug: 'type',
      orgId: ORG_ID
    },
    {
      id: 'c4bc8460-c49d-11ea-9d75-0b9d3a5ea2b1',
      slug: 'is-new-user',
      type: 'derived',
      transforms: [
        {
          operation: 'base',
          metricId: '26036350-c477-11ea-a055-be04b2e9fbcc'
        },
        {
          operation: 'dateDiff',
          value: 'months'
        },
        {
          operation: '<',
          value: 1
        }
      ],
      orgId: ORG_ID
    }
  ]

  const blocks = [
    {
      id: 'a6bdb660-c3b1-11ea-a4d3-7e9f6ddde46e',
      slug: 'messages',
      name: 'Messages',
      metricIds: [{ id: '86a70f90-c3af-11ea-adb1-8ca034704bbf' }],
      dashboardId: 'd9031d80-c3ad-11ea-bac1-bc3c2083c245',
      settings: {
        type: 'line'
      }
    }
  ]

  Promise.all([
    Dashboard.batchUpsert(dashboards),
    Dimension.batchUpsert(dimensions),
    Metric.batchUpsert(metrics),
    Block.batchUpsert(blocks)
  ]).then(() => {
    console.log('done')
  })

  // datapoints fetched from upchieve mongo for now...
})
