// import Queue from 'bull'

// import config from '../config.js'

const JOB_QUEUES = {
  // DEFAULT:
  //   new Queue('impact_api_DEFAULT', {
  //     redis: {
  //       port: config.REDIS.PORT,
  //       host: config.REDIS.REDIS_PUB_SUB_HOST || config.REDIS.CACHE_HOST
  //     },
  //     limiter: { // 100 calls per second
  //       max: 100,
  //       duration: 1000
  //     }
  //   })
}

const JOB_TYPES = {
  DEFAULT: {
    // DAILY_UPDATE_PLACE: 'impact_api:default:daily_update_place',
  }
}

const JOB_PRIORITIES =
  // lower (1) is higher priority
  { normal: 100 }

const JOB_RUNNERS = {
  DEFAULT: {
    types: {
      // [JOB_TYPES.DEFAULT.IRS_990_PROCESS_ORG_CHUNK]:
      //   { fn: Irs990ImporterJobs.processOrgChunk, concurrencyPerCpu: 2 },
    },
    queue: JOB_QUEUES.DEFAULT
  }
}

export {
  JOB_QUEUES as QUEUES,
  JOB_TYPES as TYPES,
  JOB_PRIORITIES as PRIORITIES,
  JOB_RUNNERS as RUNNERS
}
