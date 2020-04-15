package tracestep

import (
	"reflect"
	"runtime/debug"
	"unsafe"

	"github.com/opentracing/opentracing-go"
)

var buildInfo *debug.BuildInfo
var newlineByte = []byte("\n")[0]
var globalOffset int

var GoModulePath string
var GoPath string

func init() {
	buildInfo, _ = debug.ReadBuildInfo()
}

type offsetter int

func (o offsetter) Apply(*opentracing.StartSpanOptions) {}

func WithCallstackOffset(num int) opentracing.StartSpanOption {
	return offsetter(num)
}

type tracerShim struct {
	opentracing.Tracer
}

func NewTracerShim(tracer opentracing.Tracer) opentracing.Tracer {
	return &tracerShim{tracer}
}

func NewTracerShimWithOffset(tracer opentracing.Tracer, offset int) opentracing.Tracer {
	globalOffset = offset
	return NewTracerShim(tracer)
}

func (t *tracerShim) StartSpan(operationName string, opts ...opentracing.StartSpanOption) opentracing.Span {
	var offsetAmount = globalOffset
	for _, opt := range opts {
		if offset, ok := opt.(offsetter); ok {
			offsetAmount = int(offset)
		}
	}

	span := t.Tracer.StartSpan(operationName, opts...)

	stack := debug.Stack()

	offset := 0
	for count := 0; count < 5+(offsetAmount*2); count++ {
		for ; offset < len(stack); offset++ {
			if stack[offset] == newlineByte {
				offset++
				break
			}
		}
	}

	stackBytes := stack[offset:]
	bh := (*reflect.SliceHeader)(unsafe.Pointer(&stackBytes))
	stackString := *(*string)(unsafe.Pointer(&reflect.StringHeader{bh.Data, bh.Len}))

	span.SetTag("_tracestep_gopath", GoPath)
	span.SetTag("_tracestep_pkg", buildInfo.Main.Path)
	span.SetTag("_tracestep_execpath", GoModulePath)
	span.SetTag("_tracestep_stack", stackString)
	span.SetTag("_tracestep_lang", "go")

	return span
}
