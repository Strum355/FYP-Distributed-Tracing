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
    val parentSpanID: String?,
    val duration: Int,
    val startTime: Long,
    val operationName: String,
    val serviceName: String,
    val logs: List<LogPoint>?,
    val tags: List<Tag>?
) {
    companion object {
        fun fromSearchHit(hit: SearchHit): Span {
            val source = hit.sourceAsMap
            val traceID = source.get("traceID") as String
            val spanID = source.get("spanID") as String
            val duration = source.get("duration") as Int
            val startTime = source.get("startTime") as Long
            val operationName = source.get("operationName") as String
            val serviceName = (source.get("process") as Map<String, Any>).get("serviceName") as String
            val parentSpan = (source.get("references") as ArrayList<Map<String, String>>).getOrElse(0) { emptyMap() }.get("spanID")
            return Span(traceID, spanID, parentSpan, duration, startTime, operationName, serviceName, emptyArray<LogPoint>().toList<LogPoint>(), emptyArray<Tag>().toList())
        }
    }
}

public data class Tag(val key: String, val value: String)

public data class LogPoint(val timestamp: Int, val fields: List<LogPointField>)

public data class LogPointField(val key: String, val value: String)