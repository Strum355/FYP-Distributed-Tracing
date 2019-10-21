package xyz.noahsc.topology.data

data class GraphQLBody(val operationName: String, val query: String, val variables: Map<String, Any>)