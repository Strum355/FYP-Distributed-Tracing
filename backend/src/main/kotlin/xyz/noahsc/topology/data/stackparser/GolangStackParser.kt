package xyz.noahsc.topology.data.stackparser

import xyz.noahsc.topology.data.*

val scrubber1 = Regex("""\(((?:0x[a-f0-9]+, )*0x[a-f0-9]+)?\)\n""")
val scrubber2 = Regex(""" \+0x[0-9a-f]+""")

class GolangStackParser(var stacktrace: String, val execPath: String) {
    fun parse(): StackTrace {
        stacktrace = scrubber2.replace(scrubber1.replace(stacktrace, "\n"), "").replace(execPath+"/", "")
        val seq = stacktrace.trim().split("\n").chunked(2).map {
            val (packageFunc, fileLine) = it
            val pkg = parsePackageLine(packageFunc)
            val (path, line) = parseFileInfo(fileLine)
            StackFrame(pkg, path, line)
        }
        return StackTrace(seq)
    }

    private fun parsePackageLine(packageStr: String): String {
        val packageFuncSplit = packageStr.split(".")
        if (packageFuncSplit.first() == "main") {
            return "main"    
        }

        return packageFuncSplit.take(2).joinToString(separator=".")
    }

    private fun parseFileInfo(fileInfo: String): Pair<String, Int> {
        val (path, line) = fileInfo.split(":")
        return Pair(path.trim(), line.toInt())
    }
}