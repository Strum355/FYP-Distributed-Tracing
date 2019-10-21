package xyz.noahsc.topology.repository

import xyz.noahsc.topology.data.Trace
import xyz.noahsc.topology.HttpStatusException
import org.elasticsearch.index.query.TermQueryBuilder
import org.elasticsearch.client.RestClient
import org.elasticsearch.client.RestHighLevelClient
import org.elasticsearch.action.search.SearchRequest
import org.elasticsearch.search.builder.SearchSourceBuilder
import org.elasticsearch.client.RequestOptions
import mbuhot.eskotlin.query.compound.bool
import mbuhot.eskotlin.query.term.term
import mbuhot.eskotlin.query.term.range
import org.apache.http.HttpHost
import org.apache.http.HttpException
import io.ktor.http.HttpStatusCode

class ElasticsearchRepository {
    val lowLevel = RestClient.builder(HttpHost("elasticsearch", 9200))
    public val client: RestHighLevelClient = RestHighLevelClient(lowLevel)


    fun getTraceByID(traceID: String): Trace {
        val query = bool {
            must {
                term { "traceID" to traceID }
            }
        }

        val resp = client.search(
            SearchRequest("jaeger-span-*").source(SearchSourceBuilder().query(query)),
            RequestOptions.DEFAULT
        )

        if (resp.hits.totalHits.value == 0L) {
            throw HttpStatusException(HttpStatusCode.NotFound)
        }

        return Trace.fromSearchHits(traceID, resp.hits.hits)
    }
}