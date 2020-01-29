package borger

import (
	"github.com/opentracing/opentracing-go"
	"time"
)

func Do(ctx opentracing.SpanContext, tracer opentracing.Tracer) {
	span2 := tracer.StartSpan("start-req2", opentracing.ChildOf(ctx))
	defer span2.Finish()
	time.Sleep(time.Second * 1)
}
