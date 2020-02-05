package tracestep

import (
	"testing"

	"github.com/opentracing/opentracing-go/mocktracer"
)

func Test_StartSpan(t *testing.T) {
	tracer := NewTracerWrapper("github.com/Strum355/FYP-2020_Distributed-Tracing/trace_step/golang", mocktracer.New())
	span := tracer.StartSpan("sampletext", WithCallstackOffset(0))
	for k, v := range span.(*mocktracer.MockSpan).Tags() {
		t.Log(k, v)
	}
}
