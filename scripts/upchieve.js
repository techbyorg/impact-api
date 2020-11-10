import { cknex } from 'backend-shared'

import Dashboard from '../graphql/dashboard/model.js'
import Dimension from '../graphql/dimension/model.js'
import Metric from '../graphql/metric/model.js'
import Block from '../graphql/block/model.js'
import Partner from '../graphql/partner/model.js'
import Segment from '../graphql/segment/model.js'
import { setup } from '../services/setup.js'

/*
TODO: partners?

data.upchieve.org/partner/verizon

partner model w/ dashboardIds & segmentId
segmentId: '',

data.upchieve.org segments dropdown if authed?

should be flexible & allow for multiple dashboards

*/

setup().then(() => {
  console.log(`${cknex.getTimeUuidStr()}`)

  const ORG_ID = 'b6295100-bb45-11ea-91c2-9d708da068b3'

  const dashboards = [
    // {
    //   id: '87e9dec6-e009-11ea-af5f-ebaacc040fe2',
    //   slug: 'student-partner-dashboard',
    //   name: 'Student Partner Dashboard',
    //   blockIds: [
    //     { id: '0dd9e4f0-bb46-11ea-a3e0-dbf3bf48d9f8' }, // sessions
    //     { id: 'b57ca070-bd6d-11ea-b11b-51f5b01276d4' }, // sessions day of week
    //     { id: '9c366280-bd73-11ea-b87c-964ef1776e0c' }, // sessions hour of day
    //     { id: 'd62c7d30-bd73-11ea-afd8-6c48e6ae38f1' }, // sessions topic
    //     { id: '4e527bf0-bd85-11ea-9545-2467677d7f85' }, // sessions subtopic
    //     { id: 'e6ff8590-bbe2-11ea-b2e2-0a394ea8916e' }, // new students
    //     { id: '0cf1e6e0-bcaf-11ea-9d68-f0e5274248a0' }, // avg session duration
    //     { id: 'dea177f0-bcc3-11ea-b87c-9c5d694346f5' }, // chat messages per session
    //     { id: '31f4fbc0-bbf2-11ea-9187-16827e258c82' } // overview
    //   ],
    //   orgId: ORG_ID
    // },
    // {
    //   id: '87e9dec5-e009-11ea-8a77-f56702a1dfae',
    //   slug: 'volunteer-partner-dashboard',
    //   name: 'Volunteer Partner Dashboard',
    //   blockIds: [
    //     { id: '0dd9e4f0-bb46-11ea-a3e0-dbf3bf48d9f8' }, // sessions
    //     { id: 'b57ca070-bd6d-11ea-b11b-51f5b01276d4' }, // sessions day of week
    //     { id: '9c366280-bd73-11ea-b87c-964ef1776e0c' }, // sessions hour of day
    //     { id: 'd62c7d30-bd73-11ea-afd8-6c48e6ae38f1' }, // sessions topic
    //     { id: '4e527bf0-bd85-11ea-9545-2467677d7f85' }, // sessions subtopic
    //     { id: 'c18b1040-bcaa-11ea-a644-bfdddfa3ff85' }, // new volunteers
    //     { id: '0cf1e6e0-bcaf-11ea-9d68-f0e5274248a0' }, // avg session duration
    //     { id: 'dea177f0-bcc3-11ea-b87c-9c5d694346f5' } // chat messages per session
    //   ],
    //   orgId: ORG_ID
    // },
    {
      id: 'bdbe6310-bb45-11ea-8279-c32478148665',
      slug: 'high-level-metrics',
      name: 'High level metrics',
      blockIds: [
        { id: '0dd9e4f0-bb46-11ea-a3e0-dbf3bf48d9f8' }, // sessions
        { id: 'b57ca070-bd6d-11ea-b11b-51f5b01276d4' }, // sessions day of week
        { id: '9c366280-bd73-11ea-b87c-964ef1776e0c' }, // sessions hour of day
        { id: 'd62c7d30-bd73-11ea-afd8-6c48e6ae38f1' }, // sessions topic
        { id: '4e527bf0-bd85-11ea-9545-2467677d7f85' }, // sessions subtopic
        { id: 'e6ff8590-bbe2-11ea-b2e2-0a394ea8916e' }, // new students
        { id: '27a2a290-bf20-11ea-9bb6-7e3b94970fe7' }, // student states
        { id: '31f4fbc0-bbf2-11ea-9187-16827e258c82' }, // overview
        { id: 'a813e990-126b-11eb-ae14-d9ff394f936d' }, // total sessions
        { id: 'd18631a0-126d-11eb-b40c-0dd76e8a1756' } // total students
      ],
      orgId: ORG_ID
    },
    {
      id: 'f3a732e0-bb45-11ea-b4d6-01ceb3744d9b',
      slug: 'volunteers',
      name: 'Volunteers',
      blockIds: [
        { id: '0f070810-bcab-11ea-bf4c-d4221f6eef95' }, // new volunteers
        { id: '610a0ea0-bcab-11ea-8996-4b0c569ecccb' }, // onboarded volunteers
        { id: '83689b90-be0b-11ea-8025-82bda63d6893' }, // certified volunteers
        { id: '47b78d20-bcdc-11ea-89ba-7b84cbe980a7' }, // volunteer overview
        { id: 'b41ad9d0-d3a3-11ea-b273-df031a81f9e4' }, // volunteer overview internal
        { id: 'beda0670-be1d-11ea-9e09-84299b0f73ec' } // volunteer onboard percent
      ],
      orgId: ORG_ID
    },
    {
      id: 'fa5196d0-bb45-11ea-a380-7c3caf68c0ba',
      slug: 'sessions',
      name: 'Sessions',
      blockIds: [
        { id: '0cf1e6e0-bcaf-11ea-9d68-f0e5274248a0' }, // avg session duration
        { id: '6aaaab50-bcaf-11ea-a9c1-032a03f3ac0f' }, // avg session wait
        { id: 'fd870b10-bcc0-11ea-a79f-685bbc557379' }, // avg match rate
        { id: 'dea177f0-bcc3-11ea-b87c-9c5d694346f5' }, // chat messages per session
        { id: '52c3c690-bcc6-11ea-83f7-49a342e449fa' }, // session rating by topic
        { id: '59232540-bd6a-11ea-b56d-2114b4271b67' }, // session rating subtopic
        { id: 'a03dc5c0-bcca-11ea-b738-2b9c548db971' } // session overview
      ],
      orgId: ORG_ID
    },
    {
      id: 'bcce88b0-1967-11eb-a8b3-def5c40b732a',
      slug: 'daily-overview', // daily email
      name: 'Daily overview',
      defaultPermissions: {
        view: false,
        edit: false
      },
      sections: [
        { name: 'Session stats' },
        { name: 'Student stats' },
        { name: 'Volunteer stats' },
        { name: 'Total stats' }
      ],
      blockIds: [
        // session stats
        { id: '0dd9e4f0-bb46-11ea-a3e0-dbf3bf48d9f8', sectionIndex: 0 }, // sessions
        { id: 'fd870b10-bcc0-11ea-a79f-685bbc557379', sectionIndex: 0 }, // avg match rate
        { id: '0cf1e6e0-bcaf-11ea-9d68-f0e5274248a0', sectionIndex: 0 }, // avg session duration
        { id: '6aaaab50-bcaf-11ea-a9c1-032a03f3ac0f', sectionIndex: 0 }, // avg session wait
        { id: 'd8ebb7c0-bcc4-11ea-a21d-b27049928be6', sectionIndex: 0 }, // avg session rating

        // students
        { id: 'e6ff8590-bbe2-11ea-b2e2-0a394ea8916e', sectionIndex: 1 }, // new students
        // { id: '', sectionIndex: 1 }, // % of new students from partner orgs
        // { id: '', sectionIndex: 1 }, // % of new students who made a request

        // volunteers
        { id: '0f070810-bcab-11ea-bf4c-d4221f6eef95', sectionIndex: 2 }, // new volunteers
        { id: '610a0ea0-bcab-11ea-8996-4b0c569ecccb', sectionIndex: 2 }, // onboarded volunteers
        // { id: '', sectionIndex: 2 }, // % of new volunteers from partner companies

        // totals
        { id: 'a813e990-126b-11eb-ae14-d9ff394f936d', sectionIndex: 3 }, // total sessions
        { id: 'd18631a0-126d-11eb-b40c-0dd76e8a1756', sectionIndex: 3 } // total students
        // { id: '', sectionIndex: 3 } // total onboarded volunteers
      ],
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
      id: '4d198d60-1261-11eb-aeb3-485f25c50202',
      slug: 'cumulative-sessions',
      name: 'Total Sessions',
      orgId: ORG_ID
    },
    {
      id: 'ddcb9090-bbe2-11ea-a5d2-127f741e4157',
      slug: 'students',
      name: 'New students',
      dimensionIds: ['78d28e60-bee3-11ea-aef6-04f7769e2c92'],
      orgId: ORG_ID
    },
    {
      id: 'dd402bb0-1261-11eb-9de7-aac992b4b524',
      slug: 'cumulative-students',
      name: 'Total Students',
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
    },
    {
      id: 'bd99d7e0-d790-11ea-bb0e-6ae86781b0d8',
      slug: 'volunteer-session-rating',
      name: 'Volunteer session rating',
      dimensionIds: ['7d8ed360-bee2-11ea-90e4-414471c2de48', '8cf0f770-bee2-11ea-a00e-3050789e3d8f'],
      orgId: ORG_ID
    },
    {
      id: 'd40b6670-d794-11ea-9e8a-6aaab8fdb7ea',
      slug: 'volunteer-session-ratings',
      name: 'Volunteer session rating count',
      dimensionIds: ['7d8ed360-bee2-11ea-90e4-414471c2de48', '8cf0f770-bee2-11ea-a00e-3050789e3d8f'],
      orgId: ORG_ID
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
      orgId: ORG_ID,
      type: 'derived',
      transforms: [
        {
          operation: 'stateFromZip'
        }
      ]
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
      id: 'a813e990-126b-11eb-ae14-d9ff394f936d',
      slug: 'cumulative-sessions',
      name: 'Total sessions',
      metricIds: [{ id: '4d198d60-1261-11eb-aeb3-485f25c50202' }],
      dashboardId: 'bdbe6310-bb45-11ea-8279-c32478148665',
      settings: {
        type: 'line'
      }
    },
    {
      id: 'd18631a0-126d-11eb-b40c-0dd76e8a1756',
      slug: 'cumulative-students',
      name: 'Total students',
      metricIds: [{ id: 'dd402bb0-1261-11eb-9de7-aac992b4b524' }],
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
      },
      defaultPermissions: {
        view: false,
        edit: false
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
      metricIds: [{ id: 'c18b1040-bcaa-11ea-a644-bfdddfa3ff85' }],
      dashboardId: 'f3a732e0-bb45-11ea-b4d6-01ceb3744d9b',
      settings: {
        type: 'overview',
        isPinned: true
      }
    },
    {
      id: 'b41ad9d0-d3a3-11ea-b273-df031a81f9e4',
      slug: 'volunteer-overview-internal',
      name: 'Overview',
      metricIds: [{ id: 'f53b04c0-be23-11ea-b331-990b97fd2b0a' }],
      dashboardId: 'f3a732e0-bb45-11ea-b4d6-01ceb3744d9b',
      settings: {
        type: 'overview'
      },
      defaultPermissions: {
        view: false,
        edit: false
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
      },
      defaultPermissions: {
        view: false,
        edit: false
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
        omitZeroes: true
      },
      defaultPermissions: {
        view: false,
        edit: false
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
        omitZeroes: true
      },
      defaultPermissions: {
        view: false,
        edit: false
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

  const partners = [
    {
      id: '26a386c0-e009-11ea-acbf-c285941b0299',
      slug: 'edready',
      dashboardIds: [{ id: '87e9dec6-e009-11ea-af5f-ebaacc040fe2' }],
      segmentId: '4905f3a0-d74a-11ea-91bf-68939e7f3b8b',
      orgId: ORG_ID
    },
    {
      id: '26a386c1-e009-11ea-a098-7ddabfe3edb3',
      slug: 'citysquash',
      dashboardIds: [{ id: '87e9dec6-e009-11ea-af5f-ebaacc040fe2' }],
      segmentId: 'c3738780-d752-11ea-8020-c5b666b2dbd4',
      orgId: ORG_ID
    },
    {
      id: '26a386c3-e009-11ea-a2e3-aeba1bbee550',
      slug: 'queens-library',
      dashboardIds: [{ id: '87e9dec6-e009-11ea-af5f-ebaacc040fe2' }],
      segmentId: 'c3738782-d752-11ea-aafc-62636c142e88',
      orgId: ORG_ID
    },
    {
      id: '26a3add0-e009-11ea-9801-2fb568864f73',
      slug: 'oasis',
      dashboardIds: [{ id: '87e9dec6-e009-11ea-af5f-ebaacc040fe2' }],
      segmentId: 'c373ae90-d752-11ea-8871-fdf99f74cbef',
      orgId: ORG_ID
    },
    {
      id: 'c373ae92-d752-11ea-96ee-e41353af58ce',
      slug: 'mindsmatter-co',
      dashboardIds: [{ id: '87e9dec6-e009-11ea-af5f-ebaacc040fe2' }],
      segmentId: 'c373ae92-d752-11ea-96ee-e41353af58ce',
      orgId: ORG_ID
    },
    {
      id: '26a3add3-e009-11ea-b94b-42dcae55d1b9',
      slug: 'btny',
      dashboardIds: [{ id: '87e9dec6-e009-11ea-af5f-ebaacc040fe2' }],
      segmentId: 'c373ae93-d752-11ea-8429-3d4b1639f3c3',
      orgId: ORG_ID
    },
    {
      id: '26a3add4-e009-11ea-8e33-8ba99d64c0f9',
      slug: 'college-track',
      dashboardIds: [{ id: '87e9dec6-e009-11ea-af5f-ebaacc040fe2' }],
      segmentId: 'c373ae94-d752-11ea-8a0f-10df61f7ad53',
      orgId: ORG_ID
    },
    {
      id: '26a3add5-e009-11ea-801d-d4b9994a70a1',
      slug: 'spark',
      dashboardIds: [{ id: '87e9dec6-e009-11ea-af5f-ebaacc040fe2' }],
      segmentId: 'c373ae95-d752-11ea-9e8e-475846267960',
      orgId: ORG_ID
    },
    {
      id: '26a3add6-e009-11ea-b4a4-5e02159c6ee8',
      slug: 'nyc-mission',
      dashboardIds: [{ id: '87e9dec6-e009-11ea-af5f-ebaacc040fe2' }],
      segmentId: 'c373ae96-d752-11ea-9abd-8d089f03a8e8',
      orgId: ORG_ID
    },
    {
      id: '26a3add7-e009-11ea-86ef-463ebf752328',
      slug: 'college-is-real',
      dashboardIds: [{ id: '87e9dec6-e009-11ea-af5f-ebaacc040fe2' }],
      segmentId: 'c373ae97-d752-11ea-8bfd-b528445ad612',
      orgId: ORG_ID
    },
    {
      id: '26a3add8-e009-11ea-88a4-8020eac15509',
      slug: 'south-bronx-united',
      dashboardIds: [{ id: '87e9dec6-e009-11ea-af5f-ebaacc040fe2' }],
      segmentId: 'c373ae98-d752-11ea-a974-4fc00725035c',
      orgId: ORG_ID
    },
    {
      id: '26a3d4e0-e009-11ea-a881-09e9c055c37e',
      slug: 'first-graduate',
      dashboardIds: [{ id: '87e9dec6-e009-11ea-af5f-ebaacc040fe2' }],
      segmentId: '519b1e50-dc31-11ea-b31f-4cd57a79f36a',
      orgId: ORG_ID
    },
    {
      id: '87e990a0-e009-11ea-bc9d-c9d6b3fc3db7',
      slug: 'bbbs-nyc',
      dashboardIds: [{ id: '87e9dec6-e009-11ea-af5f-ebaacc040fe2' }],
      segmentId: '536bbfa0-dc31-11ea-82a2-86c2099b7e65',
      orgId: ORG_ID
    },
    {
      id: '87e9b7b0-e009-11ea-8aac-1f21b31077c5',
      slug: 'ehtp',
      dashboardIds: [{ id: '87e9dec6-e009-11ea-af5f-ebaacc040fe2' }],
      segmentId: '54ce0ec0-dc31-11ea-9695-62047e2a41c0',
      orgId: ORG_ID
    },

    // volunteers
    {
      id: '87e9b7b1-e009-11ea-ab6f-1ff7de6a85ae',
      slug: 'atlassian',
      dashboardIds: [{ id: '87e9dec5-e009-11ea-8a77-f56702a1dfae' }],
      segmentId: '7eafc921-d80f-11ea-8880-f22f5e4ffa9c',
      orgId: ORG_ID
    },
    {
      id: '87e9b7b2-e009-11ea-b621-04bbc5f412d5',
      slug: 'verizon',
      dashboardIds: [{ id: '87e9dec5-e009-11ea-8a77-f56702a1dfae' }],
      segmentId: '7eafc922-d80f-11ea-93cc-d218c7c704ee',
      orgId: ORG_ID
    },
    {
      id: '87e9b7b3-e009-11ea-b467-fc3ff27f9e17',
      slug: 'pwc',
      dashboardIds: [{ id: '87e9dec5-e009-11ea-8a77-f56702a1dfae' }],
      segmentId: '7eafc923-d80f-11ea-8cf2-fe3996136618',
      orgId: ORG_ID
    },
    {
      id: '87e9b7b4-e009-11ea-80b0-92f7b2abc003',
      slug: 'queens-library',
      dashboardIds: [{ id: '87e9dec5-e009-11ea-8a77-f56702a1dfae' }],
      segmentId: '7eafc924-d80f-11ea-a205-2ff7f7ac3529',
      orgId: ORG_ID
    },
    {
      id: '87e9b7b5-e009-11ea-9349-f1fcf8873d83',
      slug: 'mizuho',
      dashboardIds: [{ id: '87e9dec5-e009-11ea-8a77-f56702a1dfae' }],
      segmentId: '7eaff030-d80f-11ea-9efb-41529ad65462',
      orgId: ORG_ID
    },
    {
      id: '87e9b7b6-e009-11ea-8fc5-a290e3c1327e',
      slug: 'goldman-sachs',
      dashboardIds: [{ id: '87e9dec5-e009-11ea-8a77-f56702a1dfae' }],
      segmentId: '95bafc70-d80f-11ea-8a54-b1785c783c65',
      orgId: ORG_ID
    }
  ]

  const segments = [
    {
      id: '3a9114c0-d755-11ea-8a7d-92d907204a24',
      slug: 'student-none',
      orgId: ORG_ID
    },
    {
      id: '4905f3a0-d74a-11ea-91bf-68939e7f3b8b',
      slug: 'student-edready',
      orgId: ORG_ID
    },
    {
      id: 'c3738780-d752-11ea-8020-c5b666b2dbd4',
      slug: 'student-citysquash',
      orgId: ORG_ID
    },
    {
      id: 'c3738781-d752-11ea-93fa-c963b63117e9',
      slug: 'student-school-closure',
      orgId: ORG_ID
    },
    {
      id: 'c3738782-d752-11ea-aafc-62636c142e88',
      slug: 'student-queens-library',
      orgId: ORG_ID
    },
    {
      id: 'c373ae90-d752-11ea-8871-fdf99f74cbef',
      slug: 'student-oasis',
      orgId: ORG_ID
    },
    {
      id: 'c373ae91-d752-11ea-87ef-24b46ca7cfe8',
      slug: 'student-summer-search',
      orgId: ORG_ID
    },
    {
      id: 'c373ae92-d752-11ea-96ee-e41353af58ce',
      slug: 'student-mindsmatter-co',
      orgId: ORG_ID
    },
    {
      id: 'c373ae93-d752-11ea-8429-3d4b1639f3c3',
      slug: 'student-btny',
      orgId: ORG_ID
    },
    {
      id: 'c373ae94-d752-11ea-8a0f-10df61f7ad53',
      slug: 'student-college-track',
      orgId: ORG_ID
    },
    {
      id: 'c373ae95-d752-11ea-9e8e-475846267960',
      slug: 'student-spark',
      orgId: ORG_ID
    },
    {
      id: 'c373ae96-d752-11ea-9abd-8d089f03a8e8',
      slug: 'student-nyc-mission',
      orgId: ORG_ID
    },
    {
      id: 'c373ae97-d752-11ea-8bfd-b528445ad612',
      slug: 'student-college-is-real',
      orgId: ORG_ID
    },
    {
      id: 'c373ae98-d752-11ea-a974-4fc00725035c',
      slug: 'student-south-bronx-united',
      orgId: ORG_ID
    },
    {
      id: 'c373d5a0-d752-11ea-9e58-a1412c59c45d',
      slug: 'student-eligibility-appeal',
      orgId: ORG_ID
    },
    {
      id: '519b1e50-dc31-11ea-b31f-4cd57a79f36a',
      slug: 'student-first-graduate',
      orgId: ORG_ID
    },
    {
      id: '536bbfa0-dc31-11ea-82a2-86c2099b7e65',
      slug: 'student-bbbs-nyc',
      orgId: ORG_ID
    },
    {
      id: '54ce0ec0-dc31-11ea-9695-62047e2a41c0',
      slug: 'student-ehtp',
      orgId: ORG_ID
    },

    // volunteers
    {
      id: '13915dd0-d818-11ea-ae36-f0a1c5a489b0',
      slug: 'volunteer-none',
      orgId: ORG_ID
    },
    {
      id: '7eafc920-d80f-11ea-8135-0e584cd04fab',
      slug: 'volunteer-example',
      orgId: ORG_ID
    },
    {
      id: '7eafc921-d80f-11ea-8880-f22f5e4ffa9c',
      slug: 'volunteer-atlassian',
      orgId: ORG_ID
    },
    {
      id: '7eafc922-d80f-11ea-93cc-d218c7c704ee',
      slug: 'volunteer-verizon',
      orgId: ORG_ID
    },
    {
      id: '7eafc923-d80f-11ea-8cf2-fe3996136618',
      slug: 'volunteer-pwc',
      orgId: ORG_ID
    },
    {
      id: '7eafc924-d80f-11ea-a205-2ff7f7ac3529',
      slug: 'volunteer-queens-library',
      orgId: ORG_ID
    },
    {
      id: '7eaff030-d80f-11ea-9efb-41529ad65462',
      slug: 'volunteer-mizuho',
      orgId: ORG_ID
    },
    {
      id: '95bafc70-d80f-11ea-8a54-b1785c783c65',
      slug: 'volunteer-goldman-sachs',
      orgId: ORG_ID
    }
  ]

  Promise.all([
    Dashboard.batchUpsert(dashboards),
    Dimension.batchUpsert(dimensions),
    Metric.batchUpsert(metrics),
    Block.batchUpsert(blocks),
    Segment.batchUpsert(segments),
    Partner.batchUpsert(partners)
  ]).then(() => {
    console.log('done')
  })

  // datapoints fetched from upchieve mongo for now...
})
