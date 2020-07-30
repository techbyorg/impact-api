import { cknex } from 'backend-shared'

import Dashboard from '../graphql/dashboard/model.js'
import Dimension from '../graphql/dimension/model.js'
import Metric from '../graphql/metric/model.js'
import Block from '../graphql/block/model.js'
import { setup } from '../services/setup.js'
import config from '../config.js'

console.log(`${cknex.getTimeUuidStr()}`)
setup().then(() => {
  const ORG_ID = 'b633af00-cf82-11ea-86e8-e35518feec38'

  const dashboards = [
    {
      id: 'a4957da0-cf82-11ea-b9fd-74874934f95a',
      slug: 'main',
      name: 'Main',
      orgId: ORG_ID
    }
  ]

  const metrics = [
    {
      id: 'ca518660-cf82-11ea-bac1-6d126b56a3c7',
      slug: 'active-users',
      name: 'Active users',
      // dimensionIds: [''],
      orgId: ORG_ID
    }
  ]

  const dimensions = [
  ]

  const blocks = [
    {
      id: 'd4a73f10-cf82-11ea-81f8-721b2792aead',
      slug: 'active-users',
      name: 'Active users',
      metricIds: [{ id: 'ca518660-cf82-11ea-bac1-6d126b56a3c7' }],
      dashboardId: 'a4957da0-cf82-11ea-b9fd-74874934f95a',
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
