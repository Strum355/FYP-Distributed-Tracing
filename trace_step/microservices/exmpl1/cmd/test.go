package main

import (
	borger "github.com/Strum355/test/pkg"
	tracestep "github.com/Strum355/tracestep/golang"
	"github.com/opentracing/opentracing-go"
)

func Init(ctx opentracing.SpanContext) {
	span := opentracing.StartSpan("init", opentracing.ChildOf(ctx), tracestep.WithCallstackOffset(1))
	defer span.Finish()
	borger.Do(span.Context())
}
