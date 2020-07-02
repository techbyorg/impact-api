import cors from 'cors'
import express from 'express'
import Promise from 'bluebird'
import bodyParser from 'body-parser'
import http from 'http'
import ApolloServerExpress from 'apollo-server-express'
import ApolloFederation from '@apollo/federation'
import GraphQLTools from 'graphql-tools'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { Schema } from 'backend-shared'

import { setup, childSetup } from './services/setup.js'

const { ApolloServer } = ApolloServerExpress
const { buildFederatedSchema } = ApolloFederation
const { SchemaDirectiveVisitor } = GraphQLTools
const __dirname = dirname(fileURLToPath(import.meta.url))

let resolvers, schemaDirectives

const schemaPromise = Schema.getSchema({ dirName: __dirname })

Promise.config({ warnings: false })

const app = express()
app.set('x-powered-by', false)
app.use(cors())
app.use(bodyParser.json({ limit: '1mb' }))
// Avoid CORS preflight
app.use(bodyParser.json({ type: 'text/plain', limit: '1mb' }))
app.use(bodyParser.urlencoded({ extended: true })) // Kiip uses

app.get('/', (req, res) => res.status(200).send('ok'))

let typeDefs
const serverPromise = schemaPromise.then((schema) => {
  ({ typeDefs, resolvers, schemaDirectives } = schema)
  schema = buildFederatedSchema({ typeDefs, resolvers })
  // https://github.com/apollographql/apollo-feature-requests/issues/145
  SchemaDirectiveVisitor.visitSchemaDirectives(schema, schemaDirectives)

  const graphqlServer = new ApolloServer({
    schema
  })
  graphqlServer.applyMiddleware({ app, path: '/graphql' })

  return http.createServer(app)
})

export { serverPromise, setup, childSetup }
