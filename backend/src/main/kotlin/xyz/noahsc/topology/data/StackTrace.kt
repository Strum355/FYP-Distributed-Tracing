package xyz.noahsc.topology.data

import xyz.noahsc.topology.data.stackparser.*

data class StackTrace(val stackFrames: List<StackFrame>) {
    companion object {
        fun fromSpan(span: Span): StackTrace {
            val tags = span.tags ?: return StackTrace(emptyList())
            val tag = tags.filter { it.key == "_tracestep_lang" }.get(0).value
            val stack = tags.filter { it.key == "_tracestep_stack" }.get(0).value
            val execpath = span.tags.filter { it.key == "_tracestep_execpath" }.get(0).value
            return when(tag) {
                "go" -> GolangStackParser(stack, execpath).parse()
                "nodejs" -> NodeJSStackParser(stack, execpath).parse()
                else -> StackTrace(emptyList())
            }
        }
    }
}

data class StackFrame(val filename: String, val line: Int)