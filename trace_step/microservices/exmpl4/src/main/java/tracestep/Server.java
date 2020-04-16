package tracestep;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.MediaType;

import com.google.common.collect.ImmutableMap;

import io.dropwizard.Application;
import io.dropwizard.Configuration;
import io.dropwizard.setup.Environment;
import io.opentracing.Span;
import io.opentracing.Tracer;
import io.opentracing.util.GlobalTracer;
import xyz.noahsc.tracestepshim.TracerShim;

public class Server extends Application<Configuration> {

    private Server(Tracer tracer) throws Exception {
        if(!GlobalTracer.registerIfAbsent(tracer)) {
            throw new Exception("failed to register shim");
        }
    }

    @Path("/")
    @Produces(MediaType.TEXT_PLAIN)
    public class PublisherResource {
        @GET
        public String handle(@Context HttpHeaders httpHeaders) {
            Span span = Tracing.startServerSpan(httpHeaders, "GET /handle");
            try {
                System.out.println("sample test");
                span.log(ImmutableMap.of("event", "println", "value", "hello world"));
                span.setTag("_tracestep_stack", "sample text");
                return "published";
            } finally {
                span.finish();
            }
        }
    }

    @Override
    public void run(Configuration configuration, Environment environment) throws Exception {
        environment.jersey().register(new PublisherResource());
    }

    public static void main(String[] args) throws Exception {
        System.setProperty("dw.server.applicationConnectors[0].port", "8082");
        System.setProperty("dw.server.adminConnectors[0].port", "9082");
        System.setProperty("JAEGER_ENDPOINT", "http://localhost:14268/api/traces?format=jaeger.thrift");

        new Server(new TracerShim(Tracing.init("example4"), 1, "tracestep")).run(args);
    }
}