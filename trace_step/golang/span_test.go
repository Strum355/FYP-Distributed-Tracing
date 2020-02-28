package tracestep

import (
	"runtime/debug"
	"testing"

	"github.com/opentracing/opentracing-go"
	"github.com/opentracing/opentracing-go/mocktracer"
)

var (
	span opentracing.Span
)

func Test_StartSpan(t *testing.T) {
	buildInfo = &debug.BuildInfo{
		Main: debug.Module{
			Path: "test",
		},
	}
	tracer := NewTracerWrapper(mocktracer.New())
	span := tracer.StartSpan("sampletext", WithCallstackOffset(0))
	for k, v := range span.(*mocktracer.MockSpan).Tags() {
		t.Log(k, v)
	}
}

func BenchmarkStartSpanTraceStep(b *testing.B) {
	buildInfo = &debug.BuildInfo{
		Main: debug.Module{
			Path: "test",
		},
	}
	tracer := NewTracerWrapper(mocktracer.New())
	for i := 0; i < b.N; i++ {
		span = tracer.StartSpan("banana", WithCallstackOffset(0))
	}
}

func BenchmarkStartSpanBaseline(b *testing.B) {
	buildInfo = &debug.BuildInfo{
		Main: debug.Module{
			Path: "test",
		},
	}
	tracer := mocktracer.New()
	for i := 0; i < b.N; i++ {
		span = tracer.StartSpan("banana", WithCallstackOffset(0))
	}
}
