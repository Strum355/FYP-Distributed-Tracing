package main

import (
	borger "github.com/Strum355/test/pkg"
	"github.com/opentracing/opentracing-go"
)

func Init(ctx opentracing.SpanContext) {
	span := tracer1.StartSpan("init", opentracing.ChildOf(ctx))
	defer span.Finish()
	borger.Do(span.Context(), tracer2)
}
