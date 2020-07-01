import Dashboard from './model.js'

export default {
  Query: {
    dashboards: async (rootValue, { teamId }) => {
      return Dashboard.getAllByTeamId(teamId)
    }
  }
}
