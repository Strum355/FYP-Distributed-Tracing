package xyz.noahsc.tracestepshim

import io.opentracing.Tracer
import io.opentracing.Span
import io.opentracing.tag.Tag
import io.opentracing.SpanContext
import java.lang.StackTraceElement

public class TracerShim(val tracer: Tracer, val stackOffset: Int, val packageRoot: String): Tracer by tracer {
    override fun buildSpan(var1: String): Tracer.SpanBuilder {
        println("building span")
        return SpanBuilder(tracer.buildSpan(var1), packageRoot);
    }
}

private class SpanBuilder(var builder: Tracer.SpanBuilder, val packageRoot: String): Tracer.SpanBuilder{
    override fun start(): Span {
        println("hello world")
        val span = builder.start();
        val stackTrace = Throwable().stackTrace.filter { it ->
            it.className.startsWith(packageRoot)
        }.forEach { println(it) }
        
        span.setTag("_tracestep_lang", "jvm")
        span.setTag("_tracestep_stack", "asdf")
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