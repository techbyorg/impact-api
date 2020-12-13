import { cknex } from 'backend-shared'

import Dashboard from '../graphql/dashboard/model.js'
import Dimension from '../graphql/dimension/model.js'
import Metric from '../graphql/metric/model.js'
import Block from '../graphql/block/model.js'
import Segment from '../graphql/segment/model.js'
import { setup } from '../services/setup.js'
// import config from '../config.js'

console.log(`${cknex.getTimeUuidStr()}`)
setup().then(() => {
  const ORG_ID = '6f9627e0-e264-11ea-aeea-5be8aea5c0c9'

  const dashboards = [
    {
      id: 'ed10b7e0-e3d0-11ea-be8a-25d2de577ebf',
      slug: 'main',
      name: 'Main',
      blockIds: [
        { id: '9d5c66d4-e3d1-11ea-b1e5-62ef017b7d0f' },
        { id: '165fad70-e568-11ea-b834-c6fe1394a0ba' },
        { id: '1d3bb340-e569-11ea-bc23-8b438c098378' },
        { id: 'de93d380-e56c-11ea-b91e-eda2e4dac984' },
        { id: '4856b330-e574-11ea-8757-1f7253836ec0' }
      ],
      orgId: ORG_ID
    }
  ]

  /*
  DIMENSIONS: receiving org, donation type (payroll / cc), employeeId, department

  donationCount
  donationSum
  donationMatchSum
  unique donors (uniques table), retention, etc...

  days from employee join -> first donation?

  avg donation size
  avg # of donations per employee

  */

  const metrics = [
    {
      id: '9d5c18b0-e3d1-11ea-9d76-11d12d2ed70b',
      slug: 'donations',
      name: 'Donations',
      orgId: ORG_ID
    },
    {
      id: '9d5c3fc0-e3d1-11ea-a457-ce46582889c2',
      slug: 'donation-sum',
      name: 'Donations sum',
      unit: 'dollars',
      orgId: ORG_ID
    },
    {
      id: '9d5c66d0-e3d1-11ea-938b-c93d02a7ef5a',
      slug: 'donation-by-company-sum',
      name: 'Donations by company sum',
      unit: 'dollars',
      orgId: ORG_ID
    },
    {
      id: '9d5c66d1-e3d1-11ea-988b-086f67bc7d85',
      slug: 'unique-donors',
      name: 'Unique donors',
      orgId: ORG_ID
    },
    {
      id: '0ac47c70-e568-11ea-bb55-b7b0bcdd5d5b',
      slug: 'avg-donation-amount',
      name: 'Avg donation amount',
      unit: 'dollars',
      orgId: ORG_ID,
      type: 'derived',
      transforms: [
        {
          operation: 'base',
          metricId: '9d5c3fc0-e3d1-11ea-a457-ce46582889c2'
        },
        {
          operation: '/',
          metricId: '9d5c18b0-e3d1-11ea-9d76-11d12d2ed70b'
        }
      ]
    }
  ]

  const dimensions = [
    {
      id: '9d5c66d2-e3d1-11ea-9fda-e286e4767aa1',
      slug: 'donation-type', // creditCard / paypal / payroll
      orgId: ORG_ID
    },
    {
      id: '9d5c66d3-e3d1-11ea-a216-067a9306f21c',
      slug: 'donation-privacy', // shareName, private
      orgId: ORG_ID
    }
  ]

  const blocks = [
    {
      id: '9d5c66d4-e3d1-11ea-b1e5-62ef017b7d0f',
      slug: 'donations',
      orgId: ORG_ID,
      name: 'Donations',
      metricIds: [{ id: '9d5c18b0-e3d1-11ea-9d76-11d12d2ed70b' }],
      settings: {
        type: 'line'
      }
    },
    {
      id: '165fad70-e568-11ea-b834-c6fe1394a0ba',
      slug: 'avg-donation-amount',
      orgId: ORG_ID,
      name: 'Avg donation amount',
      metricIds: [{ id: '0ac47c70-e568-11ea-bb55-b7b0bcdd5d5b' }],
      settings: {
        type: 'line'
      }
    },
    {
      id: '1d3bb340-e569-11ea-bc23-8b438c098378',
      slug: 'donation-sum',
      orgId: ORG_ID,
      name: 'Total donated',
      metricIds: [{ id: '9d5c3fc0-e3d1-11ea-a457-ce46582889c2' }],
      settings: {
        type: 'line'
      }
    },
    {
      id: '4856b330-e574-11ea-8757-1f7253836ec0',
      slug: 'donation-by-company-sum',
      orgId: ORG_ID,
      name: 'Total donated by company',
      metricIds: [{ id: '9d5c66d0-e3d1-11ea-938b-c93d02a7ef5a' }],
      settings: {
        type: 'line'
      }
    },
    {
      id: 'de93d380-e56c-11ea-b91e-eda2e4dac984',
      slug: 'unique-donors',
      orgId: ORG_ID,
      name: 'Unique donors',
      metricIds: [{ id: '9d5c66d1-e3d1-11ea-988b-086f67bc7d85' }],
      settings: {
        type: 'line'
      }
    }
  ]

  const segments = [
    {
      id: '91585b90-e576-11ea-a715-b2df78f05b74',
      slug: 'partner-demo',
      orgId: ORG_ID
    }
  ]

  Promise.all([
    Dashboard.batchUpsert(dashboards),
    Dimension.batchUpsert(dimensions),
    Metric.batchUpsert(metrics),
    Block.batchUpsert(blocks),
    Segment.batchUpsert(segments)
  ]).then(() => {
    console.log('done')
  })

  // datapoints fetched from upchieve mongo for now...
})
