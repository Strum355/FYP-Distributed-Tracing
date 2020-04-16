package xyz.noahsc.topology.data.stackparser

import xyz.noahsc.topology.data.*
import java.io.File

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
            val packageName = extractModule(strippedPath)
            StackFrame(packageName, strippedPath, lineInt, false)
        }
        return StackTrace(seq)
    }

    private fun extractModule(filepath: String): String {
        val pathWithoutFile = filepath.removeSuffix(File(filepath).name)
        return when(pathWithoutFile.length) {
            0 -> "main"
            else -> pathWithoutFile
        }
}