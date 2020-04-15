package tracestep.repository;

import io.opentracing.Span;
import io.opentracing.SpanContext;
import io.opentracing.Tracer;
import io.opentracing.util.GlobalTracer;

public class Cassandra {
    public static void operation(SpanContext context) {
        Tracer tracer = GlobalTracer.get();
        Span span = tracer.buildSpan("cassandra_fetch").asChildOf(context).start();
        
        try {
            StackTraceElement[] stack = Thread.currentThread().getStackTrace();
            for(int i = 1; i < stack.length; i++) {
                System.out.println(stack[i].getFileName() + " " + stack[i].getLineNumber() + " " + stack[i].getClassName());
            }
        } finally {
            span.finish();
        }
        
    }
}