package main

import (
	"log"
	"net/http"
	"time"

	tracestep "github.com/Strum355/FYP-2020_Distributed-Tracing/trace_step/golang"
	"github.com/opentracing/opentracing-go"
	"github.com/uber/jaeger-client-go"
	"github.com/uber/jaeger-client-go/transport"
)

const (
	stackLength = 10000 * 10000 //completely arbitrary :)
	serviceName = "example1"
)

func main() {
	tracer, closer := jaeger.NewTracer(serviceName, jaeger.NewConstSampler(true), jaeger.NewRemoteReporter(transport.NewHTTPTransport("localhost:14268")), jaeger.TracerOptions.MaxTagValueLength(stackLength))
	defer closer.Close()

	opentracing.SetGlobalTracer(tracestep.NewTracerWrapper(tracer))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		span := opentracing.StartSpan("start-req", tracestep.WithCallstackOffset(1))
		defer span.Finish()

		time.Sleep(time.Millisecond * 200)

		Init(span.Context())

		time.Sleep(time.Second * 5)
		log.Print("done...")
	})
	http.ListenAndServe(":8001", nil)
}
