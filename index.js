import cors from 'cors'
import express from 'express'
import Promise from 'bluebird'
import bodyParser from 'body-parser'
import http from 'http'
import ApolloServerExpress from 'apollo-server-express'
import ApolloFederation from '@apollo/federation'
import GraphQLTools from 'graphql-tools'
import fs from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { getApiKey, Schema } from 'backend-shared'

import * as directives from './graphql/directives.js'
import HealthService from './services/health.js'
import { setup, childSetup } from './services/setup.js'
import config from './config.js'

const { ApolloServer } = ApolloServerExpress
const { buildFederatedSchema } = ApolloFederation
const { SchemaDirectiveVisitor } = GraphQLTools
const __dirname = dirname(fileURLToPath(import.meta.url))

const typeDefs = fs.readFileSync('./graphql/type.graphql', 'utf8')

const schemaPromise = Schema.getSchema({ directives, typeDefs, dirName: __dirname })

Promise.config({ warnings: false })

const app = express()
app.set('x-powered-by', false)
app.use(cors())
app.use(bodyParser.json({ limit: '1mb' }))
// Avoid CORS preflight
app.use(bodyParser.json({ type: 'text/plain', limit: '1mb' }))

app.get('/', (req, res) => res.status(200).send('ok'))

app.get('/healthcheck', HealthService.check)
app.get('/healthcheck/throw', HealthService.checkThrow)

const serverPromise = schemaPromise.then((schema) => {
  const { typeDefs, resolvers, schemaDirectives } = schema
  schema = buildFederatedSchema({ typeDefs, resolvers })
  // https://github.com/apollographql/apollo-feature-requests/issues/145
  SchemaDirectiveVisitor.visitSchemaDirectives(schema, schemaDirectives)

  const graphqlServer = new ApolloServer({
    schema,
    context: async ({ req }) => {
      let org, apiKey
      if (req.headers.authorization) {
        const apiKeyStr = req.headers.authorization.replace('Bearer ', '')
        const apiKey = await getApiKey(apiKeyStr, config.PHIL_HTTP_API_URL)
        org = apiKey?.org
      }
      return { org, apiKey }
    }
  })
  graphqlServer.applyMiddleware({ app, path: '/graphql' })

  return http.createServer(app)
})

export { serverPromise, setup, childSetup }
