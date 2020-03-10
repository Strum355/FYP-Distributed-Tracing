package main

import (
	tracestep "github.com/Strum355/FYP-2020_Distributed-Tracing/trace_step/golang"
	borger "github.com/Strum355/test/pkg"
	"github.com/opentracing/opentracing-go"
)

func Init(ctx opentracing.SpanContext) {
	span := opentracing.StartSpan("init", opentracing.ChildOf(ctx), tracestep.WithCallstackOffset(1))
	defer span.Finish()
	borger.Do(span.Context())
}
