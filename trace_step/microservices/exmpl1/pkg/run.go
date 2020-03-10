package borger

import (
	"log"
	"net/http"
	"time"

	"github.com/opentracing/opentracing-go"
)

func Do(ctx opentracing.SpanContext) {
	span := opentracing.StartSpan("make-req", opentracing.ChildOf(ctx))
	defer span.Finish()

	req, _ := http.NewRequest("GET", "http://localhost:8002", nil)

	opentracing.GlobalTracer().Inject(span.Context(), opentracing.HTTPHeaders, opentracing.HTTPHeadersCarrier(req.Header))

	resp, err := http.DefaultClient.Do(req)

	log.Printf("%v %v", resp, err)
	time.Sleep(time.Second * 1)
}
