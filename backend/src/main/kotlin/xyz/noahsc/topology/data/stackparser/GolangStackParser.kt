package xyz.noahsc.topology.data.stackparser

import xyz.noahsc.topology.data.*

private val scrubber1 = Regex("""\(((?:0x[a-f0-9]+, )*0x[a-f0-9]+)?\)\n""")
private val scrubber2 = Regex(""" \+0x[0-9a-f]+""")

class GolangStackParser(var stacktrace: String, val execPath: String) {
    fun parse(): StackTrace {
        stacktrace = scrubber1.replace(stacktrace, "\n")
        stacktrace = scrubber2.replace(stacktrace, "")
        stacktrace = stacktrace.replace(execPath+"/", "")
        val seq = stacktrace.trim().split("\n").chunked(2).map {
            val (_, fileLine) = it
            val (path, line) = parseFileInfo(fileLine)
            StackFrame(path, line)
        }
        return StackTrace(seq)
    }

    private fun parseFileInfo(fileInfo: String): Pair<String, Int> {
        val (path, line) = fileInfo.split(":")
        return Pair(path.trim(), line.toInt())
    }
}