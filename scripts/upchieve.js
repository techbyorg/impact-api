import { cknex } from 'backend-shared'

import Dashboard from '../graphql/dashboard/model.js'
import Dimension from '../graphql/dimension/model.js'
import Metric from '../graphql/metric/model.js'
import Block from '../graphql/block/model.js'
import { setup } from '../services/setup.js'

setup().then(() => {
  console.log(`${cknex.getTimeUuidStr()}`)

  const ORG_ID = 'b6295100-bb45-11ea-91c2-9d708da068b3'

  const dashboards = [
    {
      id: 'bdbe6310-bb45-11ea-8279-c32478148665',
      slug: 'high-level-metrics',
      name: 'High level metrics',
      orgId: ORG_ID
    },
    {
      id: 'f3a732e0-bb45-11ea-b4d6-01ceb3744d9b',
      slug: 'volunteers',
      name: 'Volunteers',
      orgId: ORG_ID
    },
    {
      id: 'fa5196d0-bb45-11ea-a380-7c3caf68c0ba',
      slug: 'sessions',
      name: 'Sessions',
      orgId: ORG_ID
    }
  ]

  const metrics = [
    {
      id: '9285d290-bb46-11ea-afef-2f1fddc92f4e',
      slug: 'sessions',
      name: 'Sessions',
      orgId: ORG_ID
    },
    {
      id: 'ddcb9090-bbe2-11ea-a5d2-127f741e4157',
      slug: 'students',
      name: 'New students',
      dimensionIds: ['78d28e60-bee3-11ea-aef6-04f7769e2c92'],
      orgId: ORG_ID
    },

    // volunteers
    {
      id: 'c18b1040-bcaa-11ea-a644-bfdddfa3ff85',
      slug: 'volunteers',
      name: 'New volunteers',
      orgId: ORG_ID
    },
    {
      id: '08c1ce90-bcab-11ea-8878-624249f44f96',
      slug: 'onboarded-volunteers',
      name: 'New volunteers (onboarded)',
      orgId: ORG_ID
    },
    {
      id: '5b6f0190-bcdc-11ea-b5d6-dc974ccf9517',
      slug: 'certified-volunteers',
      name: 'Certified volunteers',
      orgId: ORG_ID
    },
    {
      id: 'f53b04c0-be23-11ea-b331-990b97fd2b0a',
      slug: 'onboarded-volunteer-percent',
      name: 'Percent of volunteers onboarded',
      unit: 'percentFraction',
      orgId: ORG_ID,
      type: 'derived',
      transforms: [
        {
          operation: 'base',
          metricId: '08c1ce90-bcab-11ea-8878-624249f44f96'
        },
        {
          operation: '/',
          metricId: 'c18b1040-bcaa-11ea-a644-bfdddfa3ff85'
        }
      ]
    },

    // sessions
    {
      id: '13b4b4d0-bcaf-11ea-8e97-9b5c6b25c202',
      slug: 'session-duration',
      name: 'Session duration',
      unit: 'second',
      orgId: ORG_ID
    },
    {
      id: 'faa9d210-be3c-11ea-bda1-0f5c34ee3e68',
      slug: 'avg-session-duration',
      name: 'Avg session duration',
      unit: 'second',
      orgId: ORG_ID,
      type: 'derived',
      transforms: [
        {
          operation: 'base',
          metricId: '13b4b4d0-bcaf-11ea-8e97-9b5c6b25c202'
        },
        {
          operation: '/',
          metricId: '9285d290-bb46-11ea-afef-2f1fddc92f4e'
        }
      ]
    },
    {
      id: 'ccb83900-bcb1-11ea-a89a-d35785a085bc',
      slug: 'session-wait',
      name: 'Wait time',
      unit: 'second',
      orgId: ORG_ID
    },
    {
      id: 'd36e74f0-be3f-11ea-8429-a0679be0e293',
      slug: 'avg-wait-time',
      name: 'Avg wait time',
      unit: 'second',
      orgId: ORG_ID,
      type: 'derived',
      transforms: [
        {
          operation: 'base',
          metricId: 'ccb83900-bcb1-11ea-a89a-d35785a085bc'
        },
        {
          operation: '/',
          metricId: '9285d290-bb46-11ea-afef-2f1fddc92f4e'
        }
      ]
    },
    {
      id: 'df4ca280-bcb7-11ea-b9fc-7e99bb5f6390',
      slug: 'successful-matches',
      name: 'Successful matches',
      orgId: ORG_ID
    },
    {
      id: 'bda302b0-be41-11ea-8d56-c3c6d033c672',
      slug: 'match-rate-percent',
      name: 'Match rate percent',
      orgId: ORG_ID,
      unit: 'percentFraction',
      type: 'derived',
      transforms: [
        {
          operation: 'base',
          metricId: 'df4ca280-bcb7-11ea-b9fc-7e99bb5f6390'
        },
        {
          operation: '/',
          metricId: '9285d290-bb46-11ea-afef-2f1fddc92f4e'
        }
      ]
    },
    {
      id: '767fd6f0-be42-11ea-b1b6-c7fc32475f77',
      slug: 'chat-messages',
      name: 'Chat messages',
      orgId: ORG_ID
    },
    {
      id: 'ab78d990-bcc3-11ea-8049-c1b8cb0d12db',
      slug: 'avg-chat-messages',
      name: 'Chat messages per session',
      orgId: ORG_ID,
      type: 'derived',
      transforms: [
        {
          operation: 'base',
          metricId: '767fd6f0-be42-11ea-b1b6-c7fc32475f77'
        },
        {
          operation: '/',
          metricId: '9285d290-bb46-11ea-afef-2f1fddc92f4e'
        }
      ]
    },
    {
      id: 'df434c30-be42-11ea-af16-32d4301bf465',
      slug: 'session-rating',
      name: 'Session rating',
      dimensionIds: ['7d8ed360-bee2-11ea-90e4-414471c2de48', '8cf0f770-bee2-11ea-a00e-3050789e3d8f'],
      orgId: ORG_ID
    },
    {
      id: 'ec999250-be50-11ea-87b4-3a1c78ffe991',
      slug: 'session-ratings',
      name: 'Session rating count',
      dimensionIds: ['7d8ed360-bee2-11ea-90e4-414471c2de48', '8cf0f770-bee2-11ea-a00e-3050789e3d8f'],
      orgId: ORG_ID
    },
    {
      id: 'd8ebb7c0-bcc4-11ea-a21d-b27049928be6',
      slug: 'avg-session-rating',
      name: 'Avg session rating',
      dimensionIds: ['7d8ed360-bee2-11ea-90e4-414471c2de48', '8cf0f770-bee2-11ea-a00e-3050789e3d8f'],
      orgId: ORG_ID,
      unit: 'float',
      type: 'derived',
      transforms: [
        {
          operation: 'base',
          metricId: 'df434c30-be42-11ea-af16-32d4301bf465'
        },
        {
          operation: '/',
          metricId: 'ec999250-be50-11ea-87b4-3a1c78ffe991'
        }
      ]
    }
  ]

  const dimensions = [
    {
      id: '40633030-bee2-11ea-aca1-2c34423f409a',
      slug: 'day-of-week',
      orgId: ORG_ID
    },
    {
      id: '6a5d09b0-bee2-11ea-be55-21d391d790d5',
      slug: 'hour-of-day',
      orgId: ORG_ID
    },
    {
      id: '7d8ed360-bee2-11ea-90e4-414471c2de48',
      slug: 'topic',
      orgId: ORG_ID
    },
    {
      id: '8cf0f770-bee2-11ea-a00e-3050789e3d8f',
      slug: 'sub-topic',
      orgId: ORG_ID
    },
    {
      id: 'c49ad830-bee2-11ea-b90c-1c8a81aba660',
      slug: 'subject',
      orgId: ORG_ID
    },
    {
      id: '78d28e60-bee3-11ea-aef6-04f7769e2c92',
      slug: 'state',
      orgId: ORG_ID
    }
  ]

  const blocks = [
    {
      id: '0dd9e4f0-bb46-11ea-a3e0-dbf3bf48d9f8',
      slug: 'sessions',
      name: 'Sessions',
      metricIds: [{ id: '9285d290-bb46-11ea-afef-2f1fddc92f4e' }],
      dashboardId: 'bdbe6310-bb45-11ea-8279-c32478148665',
      settings: {
        type: 'line'
      }
    },
    {
      id: 'b57ca070-bd6d-11ea-b11b-51f5b01276d4',
      slug: 'sessions-by-day-of-week',
      name: 'Sessions by day of week',
      metricIds: [{ id: '9285d290-bb46-11ea-afef-2f1fddc92f4e', dimensionIds: ['40633030-bee2-11ea-aca1-2c34423f409a'] }],
      dashboardId: 'bdbe6310-bb45-11ea-8279-c32478148665',
      settings: {
        type: 'bar'
      }
    },
    {
      id: '9c366280-bd73-11ea-b87c-964ef1776e0c',
      slug: 'sessions-by-hour-of-day',
      name: 'Sessions by hour of day',
      metricIds: [{ id: '9285d290-bb46-11ea-afef-2f1fddc92f4e', dimensionIds: ['6a5d09b0-bee2-11ea-be55-21d391d790d5'] }],
      dashboardId: 'bdbe6310-bb45-11ea-8279-c32478148665',
      settings: {
        type: 'bar'
      }
    },
    {
      id: 'd62c7d30-bd73-11ea-afd8-6c48e6ae38f1',
      slug: 'sessions-by-topic',
      name: 'Sessions by topic',
      metricIds: [{ id: '9285d290-bb46-11ea-afef-2f1fddc92f4e', dimensionIds: ['7d8ed360-bee2-11ea-90e4-414471c2de48'] }],
      dashboardId: 'bdbe6310-bb45-11ea-8279-c32478148665',
      settings: {
        type: 'pie'
      }
    },
    {
      id: '4e527bf0-bd85-11ea-9545-2467677d7f85',
      slug: 'sessions-by-sub-topic',
      name: 'Sessions by subtopic',
      metricIds: [{ id: '9285d290-bb46-11ea-afef-2f1fddc92f4e', dimensionIds: ['8cf0f770-bee2-11ea-a00e-3050789e3d8f'] }],
      dashboardId: 'bdbe6310-bb45-11ea-8279-c32478148665',
      settings: {
        type: 'pie'
      }
    },
    {
      id: 'e6ff8590-bbe2-11ea-b2e2-0a394ea8916e',
      slug: 'students',
      name: 'New students',
      metricIds: [{ id: 'ddcb9090-bbe2-11ea-a5d2-127f741e4157', dimensionIds: ['00000000-0000-0000-0000-000000000000'] }],
      dashboardId: 'bdbe6310-bb45-11ea-8279-c32478148665',
      settings: {
        type: 'line'
      }
    },
    {
      id: '27a2a290-bf20-11ea-9bb6-7e3b94970fe7',
      slug: 'student-state-distribution',
      name: 'Student Distribution',
      metricIds: [{ id: 'ddcb9090-bbe2-11ea-a5d2-127f741e4157', dimensionIds: ['78d28e60-bee3-11ea-aef6-04f7769e2c92'] }],
      dashboardId: 'bdbe6310-bb45-11ea-8279-c32478148665',
      settings: {
        type: 'us-map'
      }
    },
    {
      id: '31f4fbc0-bbf2-11ea-9187-16827e258c82',
      slug: 'main-overview',
      name: 'Overview',
      metricIds: [{ id: '9285d290-bb46-11ea-afef-2f1fddc92f4e' }, { id: 'ddcb9090-bbe2-11ea-a5d2-127f741e4157' }],
      dashboardId: 'bdbe6310-bb45-11ea-8279-c32478148665',
      settings: {
        type: 'overview',
        isPinned: true
      }
    },

    // volunteers
    {
      id: '0f070810-bcab-11ea-bf4c-d4221f6eef95',
      slug: 'volunteers',
      name: 'New volunteers',
      metricIds: [{ id: 'c18b1040-bcaa-11ea-a644-bfdddfa3ff85' }],
      dashboardId: 'f3a732e0-bb45-11ea-b4d6-01ceb3744d9b',
      settings: {
        type: 'line'
      }
    },
    {
      id: '610a0ea0-bcab-11ea-8996-4b0c569ecccb',
      slug: 'onboarded-volunteers',
      name: 'New volunteers (onboarded)',
      metricIds: [{ id: '08c1ce90-bcab-11ea-8878-624249f44f96' }],
      dashboardId: 'f3a732e0-bb45-11ea-b4d6-01ceb3744d9b',
      settings: {
        type: 'line'
      }
    },
    {
      id: '83689b90-be0b-11ea-8025-82bda63d6893',
      slug: 'certified-volunteers-per-subject',
      name: 'New certified volunteers per subject',
      metricIds: [{ id: '5b6f0190-bcdc-11ea-b5d6-dc974ccf9517', dimensionIds: ['c49ad830-bee2-11ea-b90c-1c8a81aba660'] }],
      dashboardId: 'f3a732e0-bb45-11ea-b4d6-01ceb3744d9b',
      settings: {
        type: 'bar'
      }
    },
    {
      id: '47b78d20-bcdc-11ea-89ba-7b84cbe980a7',
      slug: 'volunteer-overview',
      name: 'Overview',
      metricIds: [{ id: 'f53b04c0-be23-11ea-b331-990b97fd2b0a' }],
      dashboardId: 'f3a732e0-bb45-11ea-b4d6-01ceb3744d9b',
      settings: {
        type: 'overview',
        isPinned: true
      }
    },
    {
      id: 'beda0670-be1d-11ea-9e09-84299b0f73ec',
      slug: 'volunteer-onboard-percent',
      name: 'Percent of volunteers onboarded',
      metricIds: [{ id: 'f53b04c0-be23-11ea-b331-990b97fd2b0a' }],
      dashboardId: 'f3a732e0-bb45-11ea-b4d6-01ceb3744d9b',
      settings: {
        type: 'line'
      }
    },

    // // sessions
    {
      id: '0cf1e6e0-bcaf-11ea-9d68-f0e5274248a0',
      slug: 'avg-session-duration',
      name: 'Avg session duration',
      metricIds: [{ id: 'faa9d210-be3c-11ea-bda1-0f5c34ee3e68' }],
      dashboardId: 'fa5196d0-bb45-11ea-a380-7c3caf68c0ba',
      settings: {
        type: 'line'
      }
    },
    {
      id: '6aaaab50-bcaf-11ea-a9c1-032a03f3ac0f',
      slug: 'avg-session-wait',
      name: 'Avg wait time',
      metricIds: [{ id: 'd36e74f0-be3f-11ea-8429-a0679be0e293' }],
      dashboardId: 'fa5196d0-bb45-11ea-a380-7c3caf68c0ba',
      settings: {
        type: 'line'
      }
    },
    {
      id: 'fd870b10-bcc0-11ea-a79f-685bbc557379',
      slug: 'avg-match-rate',
      name: 'Avg match rate',
      metricIds: [{ id: 'bda302b0-be41-11ea-8d56-c3c6d033c672' }],
      dashboardId: 'fa5196d0-bb45-11ea-a380-7c3caf68c0ba',
      settings: {
        type: 'line'
      }
    },
    {
      id: 'dea177f0-bcc3-11ea-b87c-9c5d694346f5',
      slug: 'avg-chat-messages',
      name: 'Chat messages per session',
      metricIds: [{ id: 'ab78d990-bcc3-11ea-8049-c1b8cb0d12db' }],
      dashboardId: 'fa5196d0-bb45-11ea-a380-7c3caf68c0ba',
      settings: {
        type: 'line'
      }
    },
    {
      id: '52c3c690-bcc6-11ea-83f7-49a342e449fa',
      slug: 'session-rating-by-topic',
      name: 'Session rating by topic',
      metricIds: [{ id: 'd8ebb7c0-bcc4-11ea-a21d-b27049928be6', dimensionIds: ['7d8ed360-bee2-11ea-90e4-414471c2de48'] }],
      dashboardId: 'fa5196d0-bb45-11ea-a380-7c3caf68c0ba',
      settings: {
        type: 'line',
        isPrivate: true
      }
    },
    {
      id: '59232540-bd6a-11ea-b56d-2114b4271b67',
      slug: 'session-rating-by-sub-topic',
      name: 'Session rating by subtopic',
      metricIds: [{ id: 'd8ebb7c0-bcc4-11ea-a21d-b27049928be6', dimensionIds: ['8cf0f770-bee2-11ea-a00e-3050789e3d8f'] }],
      dashboardId: 'fa5196d0-bb45-11ea-a380-7c3caf68c0ba',
      settings: {
        type: 'line',
        isPrivate: true
      }
    },
    {
      id: 'a03dc5c0-bcca-11ea-b738-2b9c548db971',
      slug: 'session-overview',
      name: 'Overview',
      // avg session length, avg wait time, success match rate %, avg messages, avg session rating
      metricIds: [{ id: '9285d290-bb46-11ea-afef-2f1fddc92f4e' }],
      dashboardId: 'fa5196d0-bb45-11ea-a380-7c3caf68c0ba',
      settings: {
        type: 'overview',
        isPinned: true
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
