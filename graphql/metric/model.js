// import { Base, cknex } from 'backend-shared'

// class MetricModel extends Base {
//   getScyllaTables () {
//     return [
//       {
//         name: 'metrics',
//         keyspace: 'impact',
//         fields: {
//           // scaledTime: 'text'
//         },
//         primaryKey: {
//           partitionKey: [], // FIXME
//           clusteringColumns: [] // FIXME
//         }
//       }
//     ]
//   }

//   getById (id) {
//     return cknex().select('*')
//       .from('metrics_by_id')
//       .where('id', '=', id)
//       .run({ isSingle: true })
//   }
// }

// export default new MetricModel()
