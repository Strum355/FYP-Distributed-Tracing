package tracestep

import (
	"reflect"
	"runtime/debug"
	"unsafe"

	"os"
	"path/filepath"

	"github.com/opentracing/opentracing-go"
)

var buildInfo *debug.BuildInfo
var newlineByte = []byte("\n")[0]

func init() {
	buildInfo, _ = debug.ReadBuildInfo()
}

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

	ex, _ := os.Executable()
	exPath := filepath.Dir(ex)

	stackBytes := stack[offset:]
	bh := (*reflect.SliceHeader)(unsafe.Pointer(&stackBytes))
	stackString := *(*string)(unsafe.Pointer(&reflect.StringHeader{bh.Data, bh.Len}))

	span.SetTag("_tracestep_pkg", buildInfo.Main.Path)
	span.SetTag("_tracestep_execpath", exPath)
	span.SetTag("_tracestep_stack", stackString)
	span.SetTag("_tracestep_lang", "go")

	return span
}
