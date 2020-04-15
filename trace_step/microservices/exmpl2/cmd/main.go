package main

import (
	"log"
	"math"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi"

	otlog "github.com/opentracing/opentracing-go/log"

	tracestep "github.com/Strum355/FYP-2020_Distributed-Tracing/trace_step/golang"
	"github.com/google/uuid"
	"github.com/opentracing/opentracing-go"
	"github.com/uber/jaeger-client-go"
	"github.com/uber/jaeger-client-go/transport"
)

const (
	stackLength = math.MaxInt64
	serviceName = "example2"
)

func handler(w http.ResponseWriter, r *http.Request) {
	defer log.Println("done...")

	ctx, _ := opentracing.GlobalTracer().Extract(opentracing.HTTPHeaders, opentracing.HTTPHeadersCarrier(r.Header))
	span := opentracing.StartSpan("start-req", opentracing.ChildOf(ctx))
	span.SetTag("request_id", uuid.New().String())
	defer span.Finish()

	req, _ := http.NewRequest("GET", "http://localhost:5001", nil)
	opentracing.GlobalTracer().Inject(span.Context(), opentracing.HTTPHeaders, opentracing.HTTPHeadersCarrier(req.Header))
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		span.LogFields(otlog.String("event", "response"), otlog.Error(err))
		return
	}
	defer resp.Body.Close()

	span.LogFields(otlog.String("event", "response"), otlog.String("message", "got response from example2"))
	log.Printf("%v %v", resp, err)

	time.Sleep(time.Millisecond * 200)
}

func main() {
	tracer, closer := jaeger.NewTracer(serviceName, jaeger.NewConstSampler(true), jaeger.NewRemoteReporter(
		transport.NewHTTPTransport("http://localhost:14268/api/traces?format=jaeger.thrift"),
		jaeger.ReporterOptions.Logger(jaeger.StdLogger),
		jaeger.ReporterOptions.BufferFlushInterval(time.Second),
	), jaeger.TracerOptions.MaxTagValueLength(stackLength))
	defer closer.Close()

	opentracing.SetGlobalTracer(tracestep.NewTracerShimWithOffset(tracer, 1))

	r := chi.NewRouter()
	r.Get("/", handler)

	go http.ListenAndServe(":8002", r)

	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt, os.Kill)
	<-sc
}
