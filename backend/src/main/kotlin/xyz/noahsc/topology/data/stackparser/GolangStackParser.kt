package xyz.noahsc.topology.data.stackparser

import xyz.noahsc.topology.data.*

class GolangStackParser(val stacktrace: String) {
    fun parse(): StackTrace {
        val seq = stacktrace.trim().split("\n").chunked(2).map {
            println(it)
            val (packageFunc, fileLine) = it
            val pkg = parsePackageLine(packageFunc)
            val (path, line) = parseFileInfo(fileLine)
            StackFrame(pkg, path, line)
        }
        return StackTrace(seq)
    }

    private fun parsePackageLine(packageStr: String): String {
        val packageFuncSplit = packageStr.split(".")
        //val funcName = packageFuncSplit.last()
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