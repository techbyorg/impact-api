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
      blockIds: [
        { id: 'cb2065b0-c90c-11ea-ad83-a4a485974815' },
        { id: 'bb6292f0-382f-11eb-b4e8-4cb4ac447a3b' },
        { id: '5ba12d40-382f-11eb-a72e-7df37af119eb' },
        { id: '1cfb3430-3831-11eb-96c5-3985fe6a9524' }
      ],
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
      id: '101677c0-3827-11eb-92ee-ef68a521c88b',
      slug: 'impact-w1-retention',
      name: 'Week 1 retention',
      orgId: ORG_ID,
      type: 'derived',
      unit: 'percentFraction',
      transforms: [
        {
          operation: 'base',
          metricId: 'b4601e10-c90c-11ea-bab5-303a5ae9e8d8',
          dimensionId: config.RETENTION_DIMENSION_UUID,
          dimensionValue: 'w1'
        },
        {
          operation: '/',
          metricId: 'b4601e10-c90c-11ea-bab5-303a5ae9e8d8',
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
      orgId: ORG_ID,
      slug: 'tech-by-active-users',
      name: 'TechBy active users',
      metricIds: [{ id: '8fa7c9b0-c90c-11ea-8e09-8b5eead937d6' }],
      dashboardId: 'a5d11a00-c873-11ea-942e-b58722db8c6e',
      settings: {
        type: 'line'
      }
    },
    // {
    //   id: '',
    //   orgId: ORG_ID,
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
      id: 'bb6292f0-382f-11eb-b4e8-4cb4ac447a3b',
      orgId: ORG_ID,
      slug: 'fundraise-active-users',
      name: 'Fundraise active users',
      metricIds: [{ id: 'a644d1e0-c90c-11ea-b2a7-fe0de85c660a' }],
      dashboardId: 'a5d11a00-c873-11ea-942e-b58722db8c6e',
      settings: {
        type: 'line'
      }
    },

    // Impact
    {
      id: '5ba12d40-382f-11eb-a72e-7df37af119eb',
      orgId: ORG_ID,
      slug: 'impact-active-users',
      name: 'Impact active users',
      metricIds: [{ id: 'b4601e10-c90c-11ea-bab5-303a5ae9e8d8' }],
      dashboardId: 'a5d11a00-c873-11ea-942e-b58722db8c6e',
      settings: {
        type: 'line'
      }
    },

    {
      id: '1cfb3430-3831-11eb-96c5-3985fe6a9524',
      orgId: ORG_ID,
      slug: 'impact-w1-retention',
      name: 'Impact week 1 retention',
      metricIds: [{ id: '101677c0-3827-11eb-92ee-ef68a521c88b' }],
      dashboardId: 'a5d11a00-c873-11ea-942e-b58722db8c6e',
      settings: {
        type: 'line'
      }
    }
  ]

  console.log('blocks', blocks)

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
