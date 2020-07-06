import { Cron } from 'backend-shared'

import { importDatapoints } from './data_import.js'

class CronService extends Cron {
  constructor () {
    super()

    // hourly (at 5 min 30s every hour)
    this.addCron('hour', '30 5 * * * *', () => {
      // importDatapoints() // FIXME
    })
  }
}

export default new CronService()
