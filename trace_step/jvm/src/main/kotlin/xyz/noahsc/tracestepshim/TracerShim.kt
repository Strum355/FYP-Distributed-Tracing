package xyz.noahsc.tracestepshim

import io.opentracing.Tracer
import io.opentracing.Span

public class TracerShim(val tracer: Tracer, val stackOffset: Int): Tracer by tracer {
    override fun buildSpan(var1: String): Tracer.SpanBuilder {
        return TracerShim.SpanBuilder(tracer.buildSpan(var1));
    }

    private class SpanBuilder(val builder: Tracer.SpanBuilder): Tracer.SpanBuilder by builder {
        override fun start(): Span {
            val span = builder.start();
            span.setTag("_tracestep_lang", "jvm")
            span.setTag("_tracestep_stack", "asdf")
            return span
        }
    }
}
