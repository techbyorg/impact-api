import _ from 'lodash'
import Promise from 'bluebird'

import Dashboard from '../graphql/dashboard/model.js'

const HEALTHCHECK_TIMEOUT = 40000
const HEALTHCHECK_THROW_TIMEOUT = 40000
const UPCHIEVE_DASHBOARD_ID = 'bdbe6310-bb45-11ea-8279-c32478148665'
const UPCHIEVE_ORG_ID = 'b6295100-bb45-11ea-91c2-9d708da068b3'

class HealthService {
  constructor () {
    this.check = this.check.bind(this)
    this.checkThrow = this.checkThrow.bind(this)
  }

  check (req, res, next) {
    return this.getStatus()
      .then(status => res.json(status)).catch(next)
  }

  // used for readinessProbe
  checkThrow (req, res, next) {
    return this.getStatus({ timeout: HEALTHCHECK_THROW_TIMEOUT })
      .then(function (status) {
        if (status.healthy) {
          return res.send('ok')
        } else {
          return res.status(400).send('fail')
        }
      })
  }

  getStatus ({ timeout } = {}) {
    if (timeout == null) { timeout = HEALTHCHECK_TIMEOUT }
    return Promise.all([
      Promise.resolve(Dashboard.getAllByOrgId(UPCHIEVE_ORG_ID))
        .timeout(timeout)
        .catch((err) => console.log(err))
    ])
      .then(function (responses) {
        const [dashboards] = responses
        const result =
        { dashboards: Boolean(_.find(dashboards, { id: UPCHIEVE_DASHBOARD_ID })) }

        result.healthy = _.every(_.values(result))
        return result
      })
  }
}

export default new HealthService()
