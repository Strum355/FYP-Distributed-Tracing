package main

import (
	tracestep "github.com/Strum355/FYP-2020_Distributed-Tracing/trace_step/golang"
	"github.com/opentracing/opentracing-go/mocktracer"
)

func main() {
	tracer := tracestep.NewTracerWrapper(mocktracer.New())
	tracer.StartSpan("test")
}
