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
import { directives, getApiKey, Schema } from 'backend-shared'

import { emailVariablesRoute } from './services/email.js'
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

app.post('/emailVariables', emailVariablesRoute)

let globalSchema

const serverPromise = schemaPromise.then((schema) => {
  const { typeDefs, resolvers, schemaDirectives } = schema
  globalSchema = buildFederatedSchema({ typeDefs, resolvers })
  // https://github.com/apollographql/apollo-feature-requests/issues/145
  SchemaDirectiveVisitor.visitSchemaDirectives(globalSchema, schemaDirectives)

  const graphqlServer = new ApolloServer({
    schema: globalSchema,
    context: async ({ req }) => {
      let user, org, apiKey
      // FIXME: somehow get org/orgUser for every req too?
      if (req.headers.user) { // FIXME: only accept this from phil server...
        user = JSON.parse(req.headers.user)
      }
      if (req.headers.org) { // FIXME: only accept this from phil server...
        org = JSON.parse(req.headers.org)
      }
      if (req.headers.authorization) {
        const apiKeyStr = req.headers.authorization.replace('Bearer ', '')
        const apiKey = await getApiKey(apiKeyStr, config.PHIL_HTTP_API_URL)
        org = apiKey?.org
      }
      return { user, org, apiKey }
    },
    formatError: (err) => {
      console.error(JSON.stringify(err, null, 2))
      return err
    }
  })
  graphqlServer.applyMiddleware({ app, path: '/graphql' })

  return http.createServer(app)
})

export { serverPromise, setup, childSetup, globalSchema }
