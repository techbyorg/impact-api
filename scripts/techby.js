import { cknex } from 'backend-shared'

import Dashboard from '../graphql/dashboard/model.js'
import Dimension from '../graphql/dimension/model.js'
import Metric from '../graphql/metric/model.js'
import Block from '../graphql/block/model.js'
import { setup } from '../services/setup.js'
import config from '../config.js'

console.log(`${cknex.getTimeUuidStr()}`)
setup().then(() => {
  const ORG_ID = '8f1d0760-c873-11ea-907c-0f562ead5101'

  const dashboards = [
    {
      id: 'a5d11a00-c873-11ea-942e-b58722db8c6e',
      slug: 'tech-by',
      name: 'TechBy',
      orgId: ORG_ID
    }
  ]

  const metrics = [
    // TechBy
    {
      id: '8fa7c9b0-c90c-11ea-8e09-8b5eead937d6',
      slug: 'tech-by-active-users',
      name: 'Unique visitors',
      // dimensionIds: [''],
      orgId: ORG_ID
    },

    // Fundraise
    {
      id: 'a644d1e0-c90c-11ea-b2a7-fe0de85c660a',
      slug: 'fundraise-active-users',
      name: 'Unique visitors',
      // dimensionIds: [''],
      orgId: ORG_ID
    },
    {
      id: 'a644d1e0-c90c-11ea-b2a7-fe0de85c660a',
      slug: 'fundraise-w1-retention',
      name: 'Week 1 retention',
      orgId: ORG_ID,
      type: 'derived',
      unit: 'percentFraction',
      transforms: [
        {
          operation: 'base',
          metricId: '',
          dimensionId: config.RETENTION_DIMENSION_UUID,
          dimensionValue: 'w1'
        },
        {
          operation: '/',
          metricId: '',
          dimensionId: config.RETENTION_DIMENSION_UUID,
          dimensionValue: 'w0'
        }
      ]
    },

    // Impact
    {
      id: 'b4601e10-c90c-11ea-bab5-303a5ae9e8d8',
      slug: 'impact-active-users',
      name: 'Unique visitors',
      // dimensionIds: [''],
      orgId: ORG_ID
    }
  ]

  const dimensions = [
    {
      id: config.RETENTION_DIMENSION_UUID,
      slug: 'retention',
      orgId: cknex.emptyUuid
    }
  ]

  const blocks = [
    {
      id: 'cb2065b0-c90c-11ea-ad83-a4a485974815',
      slug: 'tech-by-active-users',
      name: 'Active users',
      metricIds: [{ id: '8fa7c9b0-c90c-11ea-8e09-8b5eead937d6' }],
      dashboardId: 'a5d11a00-c873-11ea-942e-b58722db8c6e',
      settings: {
        type: 'line'
      }
    },
    // {
    //   id: '',
    //   slug: 'tech-by-overview',
    //   name: 'Overview',
    //   metricIds: [
    //     { id: '' },
    //     { id: '' }
    //   ],
    //   dashboardId: '',
    //   settings: {
    //     type: 'overview', isPinned: true
    //   }
    // }

    // Fundraise
    {
      id: 'cb2065b0-c90c-11ea-ad83-a4a485974815',
      slug: 'fundraise-active-users',
      name: 'Active users',
      metricIds: [{ id: 'a644d1e0-c90c-11ea-b2a7-fe0de85c660a' }],
      dashboardId: 'a5d11a00-c873-11ea-942e-b58722db8c6e',
      settings: {
        type: 'line'
      }
    },

    // Impact
    {
      id: 'cb2065b0-c90c-11ea-ad83-a4a485974815',
      slug: 'impact-active-users',
      name: 'Active users',
      metricIds: [{ id: 'b4601e10-c90c-11ea-bab5-303a5ae9e8d8' }],
      dashboardId: 'a5d11a00-c873-11ea-942e-b58722db8c6e',
      settings: {
        type: 'line'
      }
    },
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
