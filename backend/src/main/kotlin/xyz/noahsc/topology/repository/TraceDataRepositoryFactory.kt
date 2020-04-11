package xyz.noahsc.topology.repository

public class TraceDataRepositoryFactory {
    companion object {
        /**
         * Initializes and returns the trace data repository
         * based on the TRACE_DATA_STORE environment variable.
         * Defaults to Elasticsearch
         */
        fun create(): TraceDataRepository =
            when(System.getenv("TRACE_DATA_STORE")) {
                "elasticsearch" -> ElasticsearchRepository()
                else -> ElasticsearchRepository()
            }
    }
}