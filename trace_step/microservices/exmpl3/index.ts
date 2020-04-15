import express from 'express'
import * as jaeger from 'jaeger-client'
import * as opentracing from 'opentracing'
import * as tracestep from 'tracestep'
import * as uuid from 'uuid'

const traceConfig: jaeger.TracingConfig = {
  serviceName: 'example3',
  reporter: {
    collectorEndpoint: 'http://localhost:14268/api/traces?format=jaeger.thrift'
  }
}

const traceOpts: jaeger.TracingOptions = {}
const tracer = new tracestep.TraceWrapper(jaeger.initTracer(traceConfig, traceOpts), 0)
opentracing.initGlobalTracer(tracer)

const app = express()

app.listen(5001, () => {
  console.log('started listening on port 5001')
})

app.get('/', async (req, res) => {
  console.log('got request')
  const spanCtx = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, req.headers)
  const span = tracer.startSpan('nodejs_req', {
    childOf: spanCtx!!,
  })

  span.setTag('request_id', uuid.v4())
  
  await new Promise(r => setTimeout(r, 1000))
  
  /* let headers = {}
  tracer.inject(span.context(), opentracing.FORMAT_HTTP_HEADERS, headers)

  await fetch('http://localhost:8082', {
    headers: headers,
  }) */

  
  span.finish()
  
  res.send("ok epic time")
  console.log('done request')
})