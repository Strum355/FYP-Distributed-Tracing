package xyz.noahsc.topology.data.stackparser

import xyz.noahsc.topology.data.*

private val scrubber = Regex(""".*?(\/.+?:\d+).*""")

class NodeJSStackParser(var stacktrace: String, val execPath: String) {
    fun parse(): StackTrace {
        val seq = stacktrace.split("\n").mapNotNull {
            val match = scrubber.find(it)?.destructured
            // the full path:line string
            val fileInfo = match?.component1() ?: return@mapNotNull null
            val (path, line) = fileInfo.split(":")
            val strippedPath = path.removePrefix(execPath+"/")
            val lineInt = line.toInt()
            StackFrame(null, strippedPath, lineInt)
        }
        return StackTrace(seq)
    }
}