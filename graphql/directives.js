import GraphQLTools from 'graphql-tools'
import { router } from 'backend-shared'

const { SchemaDirectiveVisitor } = GraphQLTools

export const apiAuth = class ApiAuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition (field) {
    const { resolve } = field
    field.resolve = function (result, args, context, info) {
      if (context.org == null) {
        router.throw({ status: 401, info: 'Unauthorized', ignoreLog: true })
      }
      return resolve(result, args, context, info)
    }
  }
}
