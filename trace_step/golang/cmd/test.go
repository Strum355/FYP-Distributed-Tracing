package main

import (
	tracestep "github.com/Strum355/tracestep/golang"
	"github.com/opentracing/opentracing-go/mocktracer"
)

func main() {
	tracer := tracestep.NewTracerShim(mocktracer.New())
	tracer.StartSpan("test")
}
