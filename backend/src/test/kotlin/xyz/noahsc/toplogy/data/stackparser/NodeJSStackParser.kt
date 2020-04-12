package xyz.noahsc.topology.data.stackparser

import xyz.noahsc.topology.data.stackparser.NodeJSStackParser
import org.junit.jupiter.api.Assertions.assertEquals

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.CsvSource

class NodeJSStackParserTest {
    fun test() {
        val stack = """Error\n    at TraceWrapper.startSpan (/home/noah/UCC/Year4/FYP-2020_Distributed-Tracing/trace_step/nodejs/dist/index.js:27:21)\n    at /home/noah/UCC/Year4/FYP-2020_Distributed-Tracing/trace_step/microservices/exmpl3/index.js:34:25\n        -> /home/noah/UCC/Year4/FYP-2020_Distributed-Tracing/trace_step/microservices/exmpl3/index.ts:27:23\n    at Layer.handle [as handle_request] (/home/noah/UCC/Year4/FYP-2020_Distributed-Tracing/trace_step/microservices/exmpl3/node_modules/express/lib/router/layer.js:95:5)\n    at next (/home/noah/UCC/Year4/FYP-2020_Distributed-Tracing/trace_step/microservices/exmpl3/node_modules/express/lib/router/route.js:137:13)\n    at Route.dispatch (/home/noah/UCC/Year4/FYP-2020_Distributed-Tracing/trace_step/microservices/exmpl3/node_modules/express/lib/router/route.js:112:3)\n    at Layer.handle [as handle_request] (/home/noah/UCC/Year4/FYP-2020_Distributed-Tracing/trace_step/microservices/exmpl3/node_modules/express/lib/router/layer.js:95:5)\n    at /home/noah/UCC/Year4/FYP-2020_Distributed-Tracing/trace_step/microservices/exmpl3/node_modules/express/lib/router/index.js:281:22\n    at Function.process_params (/home/noah/UCC/Year4/FYP-2020_Distributed-Tracing/trace_step/microservices/exmpl3/node_modules/express/lib/router/index.js:335:12)\n    at next (/home/noah/UCC/Year4/FYP-2020_Distributed-Tracing/trace_step/microservices/exmpl3/node_modules/express/lib/router/index.js:275:10)\n    at expressInit (/home/noah/UCC/Year4/FYP-2020_Distributed-Tracing/trace_step/microservices/exmpl3/node_modules/express/lib/middleware/init.js:40:5)"""
        val execPath = "/home/noah/UCC/Year4/FYP-2020_Distributed-Tracing/trace_step/microservices/exmpl3"
        val stackTrace = NodeJSStackParser(stack, execPath).parse()
        //stackTrace
    }
}