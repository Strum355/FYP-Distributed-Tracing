package main

import (
	"log"
	"math"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	tracestep "github.com/Strum355/FYP-2020_Distributed-Tracing/trace_step/golang"
	"github.com/google/uuid"
	"github.com/opentracing/opentracing-go"
	"github.com/uber/jaeger-client-go"
	"github.com/uber/jaeger-client-go/transport"
)

const (
	stackLength = math.MaxInt64
	serviceName = "example1"
)

func handler(w http.ResponseWriter, r *http.Request) {
	span := opentracing.StartSpan("start-req")
	span.SetBaggageItem(jaeger.TraceBaggageHeaderPrefix+"gw_user_id", r.Header.Get("user_id"))
	span.SetBaggageItem(jaeger.TraceBaggageHeaderPrefix+"gw_session_id", r.Header.Get("session_id"))
	span.SetTag("request_id", uuid.New().String())
	defer span.Finish()

	time.Sleep(time.Millisecond * 200)

	Init(span.Context())

	time.Sleep(time.Second * 2)
	log.Println("done...")
}

func main() {
	tracer, closer := jaeger.NewTracer(serviceName, jaeger.NewConstSampler(true), jaeger.NewRemoteReporter(
		transport.NewHTTPTransport("http://localhost:14268/api/traces?format=jaeger.thrift"),
		jaeger.ReporterOptions.Logger(jaeger.StdLogger),
		jaeger.ReporterOptions.BufferFlushInterval(time.Second),
	), jaeger.TracerOptions.MaxTagValueLength(stackLength))
	defer closer.Close()

	opentracing.SetGlobalTracer(tracestep.NewTracerWrapperWithOffset(tracer, 1))

	http.HandleFunc("/", handler)

	go http.ListenAndServe(":8001", nil)
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt, os.Kill)
	<-sc
}
