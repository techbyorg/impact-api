import moment from 'moment'
import { Cron } from 'backend-shared'

import { importDatapoints } from './data_import.js'

class CronService extends Cron {
  constructor () {
    super()

    // hourly (at 5 min 30s every hour)
    this.addCron('hour', '30 16 * * * *', () => {
      console.log('cron')
      const todayDate = moment().format('YYYY-MM-DD')
      importDatapoints({
        startDate: todayDate,
        endDate: todayDate,
        timeScale: 'day',
        incrementAll: true
      })
    })
  }
}

export default new CronService()
