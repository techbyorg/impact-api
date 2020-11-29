import _ from 'lodash'
import graphqlServer from 'graphql'
import z from 'hyperscript'
import moment from 'moment-timezone'
import { Format } from 'backend-shared'

import { globalSchema } from '../index.js'

const { graphql } = graphqlServer

export async function emailVariablesRoute ({ body }, res) {
  const { emailTemplate, org } = body
  const query = `
    query {
        dashboard(id: "${emailTemplate.data.dashboardId}") {
        id, slug, name, sections { name },
        blocks {
          nodes {
            id
            name
            settings
            sectionIndex
            metrics {
              nodes {
                name
                unit
                dimensions {
                  nodes {
                    slug
                    datapoints(
                      segmentId: ""
                      startDate: "${moment().tz(org.timezone).subtract(8, 'days').format('YYYY-MM-DD')}"
                      endDate: "${moment().tz(org.timezone).subtract(1, 'days').format('YYYY-MM-DD')}"
                      timeScale: "day"
                    ) {
                      nodes {
                        scaledTime
                        dimensionValue
                        count
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `
  const context = {
    // fake perms
    org: {
      orgUser: {
        roles: {
          nodes: [
            {
              permissions: [
                {
                  sourceType: 'global',
                  permission: 'view',
                  value: true
                }
              ]
            }
          ]
        }
      }
    }
  }
  const dashboard = await graphql(globalSchema, query, null, context)
  console.log('dash', org, query, JSON.stringify(dashboard, null, 2))
  const blocks = dashboard.data.dashboard.blocks.nodes
  const sections = _.groupBy(blocks, 'sectionIndex')
  console.log('sec', sections)

  const $dashboard = z('.dashboard', {
    style: { 'margin-top': '16px' }
  }, [
    _.map(sections, (sectionBlocks, i) => {
      const section = dashboard.data.dashboard.sections[i]
      return z('.section', [
        z('.name', {
          style: { 'font-size': '18px', margin: '4px 12px' }
        }, section?.name),
        z('.blocks', {
          style: { display: 'flex', 'align-items': 'center', 'justify-content': 'center' }
        }, [
          _.map(sectionBlocks, (block) => {
            if (block.settings.type !== 'line') {
              return
            }
            const metric = block.metrics.nodes[0]
            const datapoints = metric.dimensions.nodes[0].datapoints.nodes
            // we grabbed 7, so the last is most recent
            const yesterdayCount = _.last(datapoints)?.count
            const priorWeekCount = _.nth(datapoints, -6)?.count
            const change = 1 - priorWeekCount / yesterdayCount
            return z('.block', {
              style: {
                margin: '12px',
                'text-align': 'center'
              }
            }, [
              z('.name', block.name),
              z('.count', { style: { 'font-size': '20px' } },
                Format.unit(yesterdayCount, metric.unit)
              ),
              priorWeekCount && yesterdayCount && z('.change', {
                style: { color: change > 0 ? 'green' : change < 0 ? 'red' : 'inherit' }
              }, [
                change > 0 ? '+' : '',
                Format.percentage(change)
              ])
            ])
          })
        ])
      ])
    })
  ])

  console.log($dashboard.outerHTML)

  // body.organizationId
  // Datapoint,get(
  //   metricId, segmentId, dimensionId, dimensionValue, timeScale, scaledTime
  // )
  res.send({ dashboard: $dashboard.outerHTML })
}
