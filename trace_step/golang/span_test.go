package tracestep

import (
	"testing"

	"github.com/opentracing/opentracing-go"
	"github.com/opentracing/opentracing-go/mocktracer"
)

var (
	span opentracing.Span
)

func Test_StartSpan(t *testing.T) {
	tracer := NewTracerShim(mocktracer.New())
	opentracing.SetGlobalTracer(tracer)
	span := opentracing.StartSpan("sampletext", WithCallstackOffset(1))
	defer span.Finish()
	func() {
		span := opentracing.StartSpan("nested", opentracing.ChildOf(span.Context()), WithCallstackOffset(1))
		for k, v := range span.(*mocktracer.MockSpan).Tags() {
			t.Log(k, v)
		}
		banana(t, span)
		span.Finish()
	}()
	for k, v := range span.(*mocktracer.MockSpan).Tags() {
		t.Log(k, v)
	}
}

func banana(t *testing.T, span opentracing.Span) {
	span = opentracing.StartSpan("function", opentracing.ChildOf(span.Context()), WithCallstackOffset(1))
	for k, v := range span.(*mocktracer.MockSpan).Tags() {
		t.Log(k, v)
	}
	span.Finish()
}

func BenchmarkStartSpanTraceStep(b *testing.B) {
	tracer := NewTracerShim(mocktracer.New())
	for i := 0; i < b.N; i++ {
		span = tracer.StartSpan("banana", WithCallstackOffset(0))
	}
}

func BenchmarkStartSpanBaseline(b *testing.B) {
	tracer := mocktracer.New()
	for i := 0; i < b.N; i++ {
		span = tracer.StartSpan("banana", WithCallstackOffset(0))
	}
}
