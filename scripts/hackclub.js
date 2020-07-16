import { cknex } from 'backend-shared'

import Dashboard from '../graphql/dashboard/model.js'
import Dimension from '../graphql/dimension/model.js'
import Metric from '../graphql/metric/model.js'
import Block from '../graphql/block/model.js'
import { setup } from '../services/setup.js'
import config from '../config.js'

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
    },
    {
      id: '0f97f9c0-c538-11ea-818b-11ca16a96b20',
      slug: 'users',
      name: 'New users',
      orgId: ORG_ID
    },
    {
      id: '10b5ece0-c538-11ea-8de2-e2ca06c46436',
      slug: 'members',
      name: 'New members',
      orgId: ORG_ID
    },
    {
      id: 'dc1066b0-c5e0-11ea-98b5-5ca0b278a0ca',
      slug: 'guest-conversion-rate',
      name: 'Guest -> Member conversion rate',
      unit: 'percentFraction',
      orgId: ORG_ID,
      type: 'derived',
      transforms: [
        {
          operation: 'base',
          metricId: '10b5ece0-c538-11ea-8de2-e2ca06c46436' // members
        },
        {
          operation: '/',
          metricId: '0f97f9c0-c538-11ea-818b-11ca16a96b20' // users
        }
      ]
    },
    {
      id: '3d7235f0-c5e1-11ea-8d14-105c5bf1769f',
      slug: 'messages-per-active-user',
      name: 'Messages per active user',
      orgId: ORG_ID,
      type: 'derived',
      transforms: [
        {
          operation: 'base',
          metricId: '86a70f90-c3af-11ea-adb1-8ca034704bbf' // messages
        },
        {
          operation: '/',
          metricId: '26036350-c477-11ea-a055-be04b2e9fbcc' // active users
        }
      ]
    },
    {
      id: '38ea0600-c5f2-11ea-82d8-495003cfeb04',
      slug: 'w1-retention',
      name: 'Week 1 retention',
      orgId: ORG_ID,
      type: 'derived',
      unit: 'percentFraction',
      transforms: [
        {
          operation: 'base',
          metricId: '26036350-c477-11ea-a055-be04b2e9fbcc',
          dimensionId: config.RETENTION_DIMENSION_UUID,
          dimensionValue: 'w1'
        },
        {
          operation: '/',
          metricId: '26036350-c477-11ea-a055-be04b2e9fbcc',
          dimensionId: config.RETENTION_DIMENSION_UUID,
          dimensionValue: 'w0'
        }
      ]
    }
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
    },
    {
      id: 'da767b40-c62c-11ea-8d97-797c6ceef7fb',
      slug: 'days-until-promoted',
      type: 'derived',
      transforms: [
        {
          operation: 'base',
          metricId: '26036350-c477-11ea-a055-be04b2e9fbcc'
        },
        {
          operation: 'dateDiff',
          value: 'days'
        },
        {
          operation: 'stringify'
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
    },
    {
      id: '02d7ed40-c537-11ea-b233-93ba5f7083a1',
      slug: 'messages-by-type',
      name: 'Messages by type',
      metricIds: [{ id: '86a70f90-c3af-11ea-adb1-8ca034704bbf', dimensionIds: ['3f2965f0-c3eb-11ea-9e02-553ec07262ef'] }],
      dashboardId: 'd9031d80-c3ad-11ea-bac1-bc3c2083c245',
      settings: {
        type: 'line'
      }
    },
    {
      id: '74a0b150-c582-11ea-80c4-aaa7ec4773c4',
      slug: 'active-users',
      name: 'Active users',
      metricIds: [{ id: '26036350-c477-11ea-a055-be04b2e9fbcc' }],
      dashboardId: 'd9031d80-c3ad-11ea-bac1-bc3c2083c245',
      settings: {
        type: 'line'
      }
    },
    {
      id: '03977740-c538-11ea-8129-3648352cafaf',
      slug: 'members',
      name: 'New members',
      metricIds: [{ id: '10b5ece0-c538-11ea-8de2-e2ca06c46436' }],
      dashboardId: 'd9031d80-c3ad-11ea-bac1-bc3c2083c245',
      settings: {
        type: 'line'
      }
    },
    {
      id: 'a8edab10-c538-11ea-b52f-249a6d1988bb',
      slug: 'users',
      name: 'New users (members + guests)',
      metricIds: [{ id: '0f97f9c0-c538-11ea-818b-11ca16a96b20' }],
      dashboardId: 'd9031d80-c3ad-11ea-bac1-bc3c2083c245',
      settings: {
        type: 'line'
      }
    },
    {
      id: '9de493c0-c5ef-11ea-9cd3-c5540c23df8c',
      slug: 'guest-conversion-rate',
      name: 'Guest conversion rate',
      metricIds: [{ id: 'dc1066b0-c5e0-11ea-98b5-5ca0b278a0ca' }],
      dashboardId: 'd9031d80-c3ad-11ea-bac1-bc3c2083c245',
      settings: {
        type: 'line'
      }
    },
    {
      id: 'a5a374f0-c5ef-11ea-b7d5-05de93dc6f26',
      slug: 'messages-per-active-user',
      name: 'Messages per active user',
      metricIds: [{ id: '3d7235f0-c5e1-11ea-8d14-105c5bf1769f' }],
      dashboardId: 'd9031d80-c3ad-11ea-bac1-bc3c2083c245',
      settings: {
        type: 'line'
      }
    },
    {
      id: '450f7c00-c5fa-11ea-a26d-654a4f2e9697',
      slug: 'w1-retention',
      name: 'Week 1 retention',
      metricIds: [{ id: '38ea0600-c5f2-11ea-82d8-495003cfeb04' }],
      dashboardId: 'd9031d80-c3ad-11ea-bac1-bc3c2083c245',
      settings: {
        type: 'line', isPrivate: true
      }
    },
    {
      id: '10277230-c62d-11ea-92dd-fa548e0c1a8c',
      slug: 'days-until-promoted',
      name: 'Days until promoted',
      metricIds: [{
        id: '10b5ece0-c538-11ea-8de2-e2ca06c46436',
        dimensionIds: ['da767b40-c62c-11ea-8d97-797c6ceef7fb']
      }],
      dashboardId: 'd9031d80-c3ad-11ea-bac1-bc3c2083c245',
      settings: {
        type: 'pie', isPrivate: true
      }
    },
    {
      id: '6de01380-c6c5-11ea-9eed-2515329376ba',
      slug: 'slack-overview',
      name: 'Overview',
      metricIds: [
        { id: '0f97f9c0-c538-11ea-818b-11ca16a96b20' },
        { id: '86a70f90-c3af-11ea-adb1-8ca034704bbf' }
      ],
      dashboardId: 'd9031d80-c3ad-11ea-bac1-bc3c2083c245',
      settings: {
        type: 'overview', isPinned: true
      }
    }
    // {
    //   id: '02d7ed40-c537-11ea-b233-93ba5f7083a1',
    //   slug: 'messages-by-new-old-user',
    //   name: 'Messages by user',
    //   metricIds: [{ id: '86a70f90-c3af-11ea-adb1-8ca034704bbf', dimensionIds: ['c4bc8460-c49d-11ea-9d75-0b9d3a5ea2b1'] }],
    //   dashboardId: 'd9031d80-c3ad-11ea-bac1-bc3c2083c245',
    //   settings: {
    //     type: 'line'
    //   }
    // }
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
