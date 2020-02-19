package xyz.noahsc.topology.data

import org.elasticsearch.search.SearchHit

public data class Trace(val traceID: String, val spans: List<Span>) {
    companion object {
        fun fromSearchHits(traceID: String, hits: Array<SearchHit>): Trace {
            val spansArray = hits.map { Span.fromSearchHit(it) }.toTypedArray<Span>()
            return Trace(traceID, spansArray.sortedBy { it.startTime })
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
            val serviceName = (source.get("process") as Map<String, Any>)["serviceName"] as String
            val parentSpan = (source.get("references") as List<Map<String, String>>).getOrElse(0) { emptyMap() }["spanID"]
            val logs = (source.get("logs") as List<Map<String, Any>>).map { LogPoint.fromSearchHitMap(it) }
            val tags = (source.get("tags") as List<Map<String, String>>).map { Tag.fromSearchHitMap(it) }
            return Span(traceID, spanID, parentSpan, duration, startTime, operationName, serviceName, logs, tags)
        }
    }
}

public data class Tag(val key: String, val type: String, val value: String) {
    companion object {
        fun fromSearchHitMap(map: Map<String, String>): Tag {
            return Tag(map.get("key")!!, map.get("type")!!, map.get("value")!!)
        }
    }
}

public data class LogPoint(val timestamp: Int, val fields: List<LogPointField>) {
    companion object {
        fun fromSearchHitMap(map: Map<String, Any>): LogPoint {
            return LogPoint(
                map.get("timestamp") as Int,
                (map.get("fields") as List<Map<String, String>>).map { LogPointField.fromSearchHitMap(it) }
            )
        }
    }
}

public data class LogPointField(val key: String, val type: String, val value: String) {
    companion object {
        fun fromSearchHitMap(map: Map<String, String>): LogPointField {
            return LogPointField(map.get("key")!!, map.get("type")!!, map.get("value")!!)
        }
    }
}