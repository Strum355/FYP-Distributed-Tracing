package main

import (
	"github.com/Strum355/FYP-2020_Distributed-Tracing/trace_step/golang"
	"github.com/Strum355/test/pkg"
	"github.com/opentracing/opentracing-go"
	"github.com/uber/jaeger-client-go/config"
	"io"
	"log"
	"time"
)

var (
	tracer1 opentracing.Tracer
	tracer2 opentracing.Tracer
)

func main() {
	c := config.Configuration{
		ServiceName: "example1",
		Reporter: &config.ReporterConfig{
			LocalAgentHostPort: "localhost:6831",
		},
		Sampler: &config.SamplerConfig{
			Type:  "const",
			Param: 1.0,
		},
	}

	var (
		closer1 io.Closer
		closer2 io.Closer
		err     error
	)

	tracer1, closer1, err = c.NewTracer()
	if err != nil {
		panic(err)
	}
	defer func() {
		log.Print(closer1.Close())
	}()

	c = config.Configuration{
		ServiceName: "example2",
		Reporter: &config.ReporterConfig{
			LocalAgentHostPort: "localhost:6831",
		},
		Sampler: &config.SamplerConfig{
			Type:  "const",
			Param: 1.0,
		},
	}

	tracer2, closer2, _ = c.NewTracer()
	defer func() {
		log.Print(closer2.Close())
	}()

	tracer1 = tracestep.NewTracerWrapper("github.com/Strum355/test", tracer1)
	tracer2 = tracestep.NewTracerWrapper("github.com/Strum355/test", tracer2)

	span := tracer1.StartSpan("start-req")
	defer span.Finish()

	time.Sleep(time.Millisecond * 200)

	func() {
		span1 := tracer1.StartSpan("banana", opentracing.ChildOf(span.Context()))
		defer span1.Finish()
		borger.Do(span1.Context(), tracer2)
		time.Sleep(time.Millisecond * 700)
	}()

	time.Sleep(time.Second * 5)
	log.Print("done...exiting")
}
