import GraphQLTools from 'graphql-tools'
import { router } from 'backend-shared'

const { SchemaDirectiveVisitor } = GraphQLTools

export const apiAuth = class ApiAuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition (field) {
    const { resolve } = field
    field.resolve = function (result, args, context, info) {
      if (context.org == null) {
        console.log('throw invalid api key')
        router.throw({ status: 401, info: 'Invalid API Key', ignoreLog: true })
      }
      return resolve(result, args, context, info)
    }
  }
}
