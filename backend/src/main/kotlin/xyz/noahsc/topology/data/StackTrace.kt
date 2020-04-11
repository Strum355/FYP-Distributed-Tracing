package xyz.noahsc.topology.data

import xyz.noahsc.topology.data.stackparser.*

data class StackTrace(val stackFrames: List<StackFrame>) {
    companion object {
        fun fromSpan(span: Span): StackTrace {
            val tag = span.tags?.filter { it.key == "_tracestep_lang" }?.get(0)
            val stack = span.tags?.filter { it.key == "_tracestep_stack" }?.get(0)
            when(tag?.value) {
                "go" -> return GolangStackParser(stack!!.value, 
                    span.tags.filter { 
                        it.key == "_tracestep_execpath" 
                    }.get(0).value
                ).parse()
                else -> return StackTrace(listOf())
            }
        }
    }
}

data class StackFrame(val packageName: String, val filename: String, val line: Int)