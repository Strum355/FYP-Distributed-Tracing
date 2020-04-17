package xyz.noahsc.tracestepshim

import io.opentracing.Tracer
import io.opentracing.Span
import io.opentracing.tag.Tag
import io.opentracing.SpanContext
import java.lang.StackTraceElement

private val mainClassRe = Regex("""Main-Class: ((?:[a-zA-Z]+\.)+)[a-zA-Z]+""")

public class TracerShim(val tracer: Tracer, val stackOffset: Int): Tracer by tracer {
    val packageRoot: String
    init {
        val manifest = this.javaClass.classLoader.getResource("META-INF/MANIFEST.MF")
        packageRoot = mainClassRe.find(manifest.readText())!!.destructured.component1().removeSuffix(".")
        println(packageRoot)
    }

    override fun buildSpan(operationName: String): Tracer.SpanBuilder {
        return SpanBuilder(tracer.buildSpan(operationName), packageRoot)
    }

    private class SpanBuilder(var builder: Tracer.SpanBuilder, val packageRoot: String): Tracer.SpanBuilder {
        override fun start(): Span {
            val span = builder.start()
            val stackBuilder = StringBuilder()
            Thread.currentThread().stackTrace.filter { it ->
                it.className.startsWith(packageRoot)
            }.forEach { 
                stackBuilder.append("${it.className} ${it.lineNumber}\n")
            }
            
            span.setTag("_tracestep_lang", "jvm")
            span.setTag("_tracestep_stack", stackBuilder.toString())
            return span
        }
    
        override fun asChildOf(parent: SpanContext) = apply {
            builder = builder.asChildOf(parent)
        }
    
        override fun ignoreActiveSpan() = apply {
            builder = builder.ignoreActiveSpan()
        }
    
        override fun asChildOf(parent: Span) = apply {
            builder = builder.asChildOf(parent)
        }
    
        override fun addReference(referenceType: String, referencedContext: SpanContext) = apply {
            builder = builder.addReference(referenceType, referencedContext)
        }
    
        override fun withTag(key: String, value: String) = apply {
            builder = builder.withTag(key, value)
        }
    
        override fun <T>withTag(tag: Tag<T>, value: T) = apply {
            builder = builder.withTag(tag, value)
        }
    
        override fun withTag(key: String, value: Boolean) = apply {
            builder = builder.withTag(key, value)
        }
    
        override fun withTag(key: String, value: Number) = apply {
            builder = builder.withTag(key, value)
        }
    
        override fun withStartTimestamp(microseconds: Long) = apply {
            builder = builder.withStartTimestamp(microseconds)
        }
    }
}