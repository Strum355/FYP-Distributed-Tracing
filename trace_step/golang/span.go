package tracestep

import (
	"github.com/opentracing/opentracing-go"
	"runtime"
	"strings"
)

type offsetter int

func (o offsetter) Apply(*opentracing.StartSpanOptions) {}

func WithCallstackOffset(num int) opentracing.StartSpanOption {
	return offsetter(num)
}

type tracerWrapper struct {
	opentracing.Tracer
}

func NewTracerWrapper(tracer opentracing.Tracer) opentracing.Tracer {
	return &tracerWrapper{tracer}
}

func (t *tracerWrapper) StartSpan(operationName string, opts ...opentracing.StartSpanOption) opentracing.Span {
	var offsetAmount int
	for _, opt := range opts {
		if offset, ok := opt.(offsetter); ok {
			offsetAmount = int(offset)
		}
	}

	pc, file, line, _ := runtime.Caller(1 + offsetAmount)
	span := t.Tracer.StartSpan(operationName, opts...)
	pkg := strings.Split(runtime.FuncForPC(pc).Name(), "/")
	span.SetTag("_tracestep_file", file)
	span.SetTag("_tracestep_line", line)
	span.SetTag("_tracestep_pkg", strings.Join(pkg[:len(pkg)-1], "/"))
	return span
}
