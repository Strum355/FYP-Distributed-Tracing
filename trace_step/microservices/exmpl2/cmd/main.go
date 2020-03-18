package main

import (
	"log"
	"net/http"
	"time"

	tracestep "github.com/Strum355/FYP-2020_Distributed-Tracing/trace_step/golang"
	"github.com/opentracing/opentracing-go"
	"github.com/uber/jaeger-client-go"
	"github.com/uber/jaeger-client-go/config"
)

const (
	stackLength = 10000 * 10000 //completely arbitrary :)
	serviceName = "example2"
)

func main() {
	rep, _ := (&config.ReporterConfig{LocalAgentHostPort: "localhost:6831"}).NewReporter(serviceName, nil, nil)
	sampler, _ := (&config.SamplerConfig{Type: "const", Param: 1.0}).NewSampler(serviceName, nil)
	tracer1, closer1 := jaeger.NewTracer(serviceName, sampler, rep, jaeger.TracerOptions.MaxTagValueLength(stackLength))
	defer closer1.Close()

	opentracing.SetGlobalTracer(tracestep.NewTracerWrapper(tracer1))

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		ctx, _ := opentracing.GlobalTracer().Extract(opentracing.HTTPHeaders, opentracing.HTTPHeadersCarrier(r.Header))
		span := opentracing.StartSpan("start-req", opentracing.ChildOf(ctx), tracestep.WithCallstackOffset(1))
		defer span.Finish()

		time.Sleep(time.Millisecond * 200)

		log.Print("done...")
	})
	http.ListenAndServe(":8002", nil)
}