/* eslint-disable
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
import _ from 'lodash'
import { assertNoneMissing } from 'backend-shared'

const {
  env
} = process

const config = {
  PORT: env.IRS_990_PORT || 3000,
  ENV: env.DEBUG_ENV || env.NODE_ENV,
  MAX_CPU: env.IRS_990_API_MAX_CPU || 1,
  REDIS: {
    PREFIX: 'impact_api',
    PUB_SUB_PREFIX: 'impact_api_pub_sub',
    PORT: 6379,
    CACHE_HOST: env.REDIS_CACHE_HOST || 'localhost',
    PERSISTENT_HOST: env.REDIS_PERSISTENT_HOST || 'localhost',
    PUB_SUB_HOST: env.REDIS_PUB_SUB_HOST || 'localhost'
  },
  SCYLLA: {
    KEYSPACE: 'impact_api',
    PORT: 9042,
    CONTACT_POINTS: (env.SCYLLA_CONTACT_POINTS || 'localhost').split(',')
  },
  ELASTICSEARCH: {
    PORT: 9200,
    HOST: env.ELASTICSEARCH_HOST || 'localhost'
  },
  ENVS: {
    DEV: 'development',
    PROD: 'production',
    TEST: 'test'
  }
}

assertNoneMissing(config)

export default config
