import moment from 'moment-timezone'
import { Cron } from 'backend-shared'

import config from '../config.js'
import { importDatapoints } from './data_import.js'

class CronService extends Cron {
  constructor () {
    super()

    // hourly (at 16 min 30s every hour)
    this.addCron('hour', '30 56 * * * *', () => {
      console.log('cron')
      if (config.ENV === config.ENVS.PROD) {
        const todayDate = moment().format('YYYY-MM-DD')
        importDatapoints({
          startDate: todayDate,
          endDate: todayDate,
          timeScale: 'day',
          incrementAll: true
        })
      }
    })
  }
}

export default new CronService()
