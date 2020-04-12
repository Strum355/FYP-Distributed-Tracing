package xyz.noahsc.topology.data.stackparser

import xyz.noahsc.topology.data.*

private val scrubber = Regex(""".*?(\/.+?:\d+).*""")

class NodeJSStackParser(var stacktrace: String, val execPath: String) {
    fun parse(): StackTrace {
        val seq = stacktrace.split("\n").map { 
            val match = scrubber.find(it)!!.destructured.component1()
            val (path, line) = match.split(":")
            val strippedPath = path.removePrefix(execPath+"/")
            val lineInt = line.toInt()
            StackFrame(strippedPath, lineInt)
        }
        return StackTrace(seq)
    }
}