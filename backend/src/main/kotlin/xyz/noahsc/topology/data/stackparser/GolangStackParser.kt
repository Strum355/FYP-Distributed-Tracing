package xyz.noahsc.topology.data.stackparser

import xyz.noahsc.topology.data.*

private val scrubber1 = Regex("""\(((?:0x[a-f0-9]+, )*0x[a-f0-9]+)?\)\n""")
private val scrubber2 = Regex(""" \+0x[0-9a-f]+""")

class GolangStackParser(var stacktrace: String, val execPath: String, val gopath: String) {
    fun parse(): StackTrace {
        stacktrace = scrubber1.replace(stacktrace, "\n")
        stacktrace = scrubber2.replace(stacktrace, "")
        stacktrace = stacktrace.replace(execPath+"/", "")
        stacktrace = stacktrace.replace(gopath, "")
        val seq = stacktrace.trim().split("\n").chunked(2).map {
            val (packageFunc, fileLine) = it
            val (path, line) = parseFileInfo(fileLine) 
            // if this is a non vendored dep
            var pkg: String? = null
            if (path.startsWith("/pkg/mod")) {
                pkg = parsePackageLine(packageFunc)
            }
            StackFrame(pkg, path, line)
        }
        return StackTrace(seq)
    }

    private fun parsePackageLine(packageStr: String): String? {
        val packageFuncSplit = packageStr.split(".")
        if (packageFuncSplit.first() == "main") {
            return null
        }

        if (packageFuncSplit.first().contains("/")) {
            return packageFuncSplit.first()
        }

        return packageFuncSplit.take(2).joinToString(separator=".")
    }

    private fun parseFileInfo(fileInfo: String): Pair<String, Int> {
        val (path, line) = fileInfo.split(":")
        return Pair(path.trim(), line.toInt())
    }
}