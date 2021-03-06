module github.com/Strum355/test

go 1.13

replace github.com/Strum355/tracestep/golang => ../../golang

require (
	github.com/Strum355/tracestep/golang v0.0.0
	github.com/codahale/hdrhistogram v0.0.0-20161010025455-3a0bb77429bd // indirect
	github.com/opentracing/opentracing-go v1.1.0
	github.com/uber/jaeger-client-go v2.21.1+incompatible
	github.com/uber/jaeger-lib v2.2.0+incompatible // indirect
	go.uber.org/atomic v1.6.0 // indirect
	github.com/google/uuid v1.1.1
)
