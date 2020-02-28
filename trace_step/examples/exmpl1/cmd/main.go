package main

import (
	"io"
	"log"
	"time"

	tracestep "github.com/Strum355/FYP-2020_Distributed-Tracing/trace_step/golang"
	"github.com/opentracing/opentracing-go"
	"github.com/uber/jaeger-client-go"
	"github.com/uber/jaeger-client-go/config"
)

var (
	tracer1 opentracing.Tracer
	tracer2 opentracing.Tracer
)

const (
	stackLength = 10000 * 10000 //completely arbitrary :)
)

func main() {
	var (
		closer1 io.Closer
		closer2 io.Closer
	)

	rep, _ := (&config.ReporterConfig{LocalAgentHostPort: "localhost:6831"}).NewReporter("example1", nil, nil)
	sampler, _ := (&config.SamplerConfig{Type: "const", Param: 1.0}).NewSampler("example1", nil)

	tracer1, closer1 = jaeger.NewTracer("example1", sampler, rep, jaeger.TracerOptions.MaxTagValueLength(stackLength))
	defer closer1.Close()

	rep, _ = (&config.ReporterConfig{LocalAgentHostPort: "localhost:6831"}).NewReporter("example2", nil, nil)
	sampler, _ = (&config.SamplerConfig{Type: "const", Param: 1.0}).NewSampler("example2", nil)
	tracer2, closer2 = jaeger.NewTracer("example2", sampler, rep, jaeger.TracerOptions.MaxTagValueLength(stackLength))
	defer closer2.Close()

	tracer1 = tracestep.NewTracerWrapper(tracer1)
	tracer2 = tracestep.NewTracerWrapper(tracer2)

	span := tracer1.StartSpan("start-req")
	defer span.Finish()

	time.Sleep(time.Millisecond * 200)

	func() {
		span1 := tracer1.StartSpan("banana", opentracing.ChildOf(span.Context()))
		defer span1.Finish()
		Init(span1.Context())
		time.Sleep(time.Millisecond * 700)
	}()

	time.Sleep(time.Second * 5)
	log.Print("done...exiting")
}
