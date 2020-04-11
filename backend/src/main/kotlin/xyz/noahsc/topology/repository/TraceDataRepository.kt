package xyz.noahsc.topology.repository

import xyz.noahsc.topology.data.Trace

/**
 * Defines the contract for a repository that
 * interfaces with a backing store in which 
 * trace data is stored.
 */
public interface TraceDataRepository {
    /**
     * Returns a Trace instance from the backing store
     * based on the trace ID passed.
     */
    fun getTraceByID(traceID: String): Trace

    /**
     * Closes the connection to the data store
     */
    fun close()
}