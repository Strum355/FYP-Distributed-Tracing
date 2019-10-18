package xyz.noahsc.topology.data

import org.elasticsearch.search.SearchHit

public data class Trace(val traceID: String, val spans: List<Span>) {
    companion object {
        fun fromSearchHits(traceID: String, hits: Array<SearchHit>): Trace {
            val spansArray = hits.map { Span.fromSearchHit(it) }.toTypedArray<Span>()
            return Trace(traceID, spansArray.toList())
        }
    }
}

public data class Span(
    val traceID: String,
    val spanID: String,
    val duration: Int,
    val startTime: Int,
    val operationName: String,
    val serviceName: String,
    val logs: List<LogPoint>?,
    val tags: List<Tag>?
) {
    companion object {
        fun fromSearchHit(hit: SearchHit): Span {
            
            return Span("", "", 1, 1, "", "", emptyArray<LogPoint>().toList<LogPoint>(), emptyArray<Tag>().toList())
        }
    }
}

public data class Tag(val key: String, val value: String)

public data class LogPoint(val timestamp: Int, val fields: List<LogPointField>)

public data class LogPointField(val key: String, val value: String)