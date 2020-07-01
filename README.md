## README
The best way to get familiar with this API is through the documentation on the GraphQL Playground: [https://api.techby.org/990/v1/graphql](https://api.techby.org/990/v1/graphql)

Click the "Docs" button on the right of the screen to see what is possible. Most advanced queries you write will use Elasticsearch DSL.

## Importing
If you want to run your own instance and import data, here's how:

### Getting Started
`npm install`

Have ScyllaDB/Cassandra, Elasticsearch and Redis running (Docker commands below work)
- `docker run -i --rm --name scylla -p 9042:9042 -v /var/lib/scylla:/var/lib/scylla -t scylladb/scylla:3.0.0`
- `docker run -p 9200:9200 -p 9300:9300 -v /data:/data -e "discovery.type=single-node" -e "cluster.routing.allocation.disk.threshold_enabled=false" docker.elastic.co/elasticsearch/elasticsearch-oss:7.5.2`
- `docker run -i --rm --name redis -p 6379:6379 -v /data:/data -t redis:3.2.0`

`npm run dev`
