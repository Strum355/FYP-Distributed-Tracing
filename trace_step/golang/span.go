package tracestep

import (
	"bytes"
	"reflect"
	"regexp"
	"runtime/debug"
	"strings"
	"unsafe"

	"github.com/opentracing/opentracing-go"
)

var scubber1 = regexp.MustCompile(`\((?:0x[a-f0-9]+, )*0x[a-f0-9]+\)`)
var scrubber2 = regexp.MustCompile(` \+0x[0-9a-f]+`)

type offsetter int

func (o offsetter) Apply(*opentracing.StartSpanOptions) {}

func WithCallstackOffset(num int) opentracing.StartSpanOption {
	return offsetter(num)
}

type tracerWrapper struct {
	baseImport string
	opentracing.Tracer
}

func NewTracerWrapper(baseImport string, tracer opentracing.Tracer) opentracing.Tracer {
	return &tracerWrapper{baseImport, tracer}
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
	stackSplit := bytes.Split(stack[:len(stack)-2], []byte("\n"))[5+(offsetAmount*2):]
	stackBytes := bytes.Join(stackSplit, []byte("\n"))
	bh := (*reflect.SliceHeader)(unsafe.Pointer(&stackBytes))
	stackString := *(*string)(unsafe.Pointer(&reflect.StringHeader{bh.Data, bh.Len}))
	stackString = scubber1.ReplaceAllString(stackString, "")
	stackString = scrubber2.ReplaceAllString(stackString, "")
	span.SetTag("_tracestep_stack", stackString)

	var isMain bool
	if strings.Split(string(stackSplit[0]), ".")[0] == "main" {
		isMain = true
	}

	span.SetTag("_tracestep_main", isMain)

	return span
}
