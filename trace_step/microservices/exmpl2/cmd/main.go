package main

import (
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	tracestep "github.com/Strum355/FYP-2020_Distributed-Tracing/trace_step/golang"
	"github.com/google/uuid"
	"github.com/opentracing/opentracing-go"
	"github.com/uber/jaeger-client-go"
	"github.com/uber/jaeger-client-go/transport"
)

const (
	stackLength = 10000 * 10000 //completely arbitrary :)
	serviceName = "example2"
)

func main() {
	tracer, closer := jaeger.NewTracer(serviceName, jaeger.NewConstSampler(true), jaeger.NewRemoteReporter(
		transport.NewHTTPTransport("http://localhost:14268/api/traces?format=jaeger.thrift"),
		jaeger.ReporterOptions.Logger(jaeger.StdLogger),
		jaeger.ReporterOptions.BufferFlushInterval(time.Second),
	), jaeger.TracerOptions.MaxTagValueLength(stackLength))
	defer closer.Close()

	opentracing.SetGlobalTracer(tracestep.NewTracerWrapper(tracer))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		ctx, _ := opentracing.GlobalTracer().Extract(opentracing.HTTPHeaders, opentracing.HTTPHeadersCarrier(r.Header))
		span := opentracing.StartSpan("start-req", opentracing.ChildOf(ctx), tracestep.WithCallstackOffset(1))
		span.SetTag("request_id", uuid.New().String())
		defer span.Finish()

		time.Sleep(time.Millisecond * 200)

		log.Println("done...")
	})
	go http.ListenAndServe(":8002", nil)
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt, os.Kill)
	<-sc
}
