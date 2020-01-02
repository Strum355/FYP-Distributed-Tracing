package tracestep

import (
	"github.com/opentracing/opentracing-go/mocktracer"
	"testing"
)

func Test_StartSpan(t *testing.T) {
	tracer := NewTracerWrapper(mocktracer.New())
	span := tracer.StartSpan("sampletext", WithCallstackOffset(0))
	for k, v := range span.(*mocktracer.MockSpan).Tags() {
		t.Log(k, v)
	}
}
