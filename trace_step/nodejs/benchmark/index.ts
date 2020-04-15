import * as b from 'benny'
import * as opt from 'opentracing'
import { TraceWrapper } from '../src/index'

b.suite(
  'Tracer Benchmarks',
  b.add('With Shim', () => {
    const mockTracer = new opt.MockTracer()
    const tracer = new TraceWrapper(mockTracer, 2)
    const span = tracer.startSpan("sampletext")
    span.finish()
  }),
  b.add('Without Shim', () => {
    const mockTracer = new opt.MockTracer()
    const span = mockTracer.startSpan("sampletext")
    span.finish()
  }),
  b.cycle(),
  b.complete()
)