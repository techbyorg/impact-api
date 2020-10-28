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
        id, slug, name
        blocks {
          nodes {
            id
            name
            settings
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
  const context = {}
  const dashboard = await graphql(globalSchema, query, null, context)
  console.log('dash', org, query, JSON.stringify(dashboard, null, 2))

  const $dashboard = z('.dashboard', {
    style: { display: 'flex', 'align-items': 'center', 'justify-content': 'center' }
  }, [
    _.map(dashboard.data.dashboard.blocks.nodes, (block) => {
      if (block.settings.type !== 'line') {
        return
      }
      const datapoints = block.metrics.nodes[0].dimensions.nodes[0].datapoints.nodes
      // we grabbed 7, so the last is most recent
      const yesterdayCount = _.last(datapoints)?.count
      const priorWeekCount = _.nth(datapoints, -7)?.count
      const change = 1 - priorWeekCount / yesterdayCount
      return z('.block', {
        style: {
          margin: '12px',
          'text-align': 'center'
        }
      }, [
        z('.name', block.name),
        z('.count', { style: { 'font-size': '20px' } }, yesterdayCount),
        priorWeekCount && yesterdayCount && z('.change', [
          change > 0 ? '+' : '',
          Format.percentage(change)
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
