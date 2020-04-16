import 'clarify'
import * as opentracing from 'opentracing'
import { dirname } from 'path'
import { install } from 'source-map-support'
import 'trace'

export class TraceShim extends opentracing.Tracer {
  private tracer: opentracing.Tracer
  private stackOffset: number

  constructor(tracer: opentracing.Tracer, stackOffset: number) {
    super()
    install()
    this.tracer = tracer
    this.stackOffset = stackOffset
    Error.stackTraceLimit = Infinity
  }

  startSpan(name: string, options: opentracing.SpanOptions = {}): opentracing.Span {
    const span = this.tracer.startSpan(name, options)
    let stack = new Error().stack
    stack = stack.replace('Error: \n    ', '')
    stack = stack.substring(stack.indexOf('\n') + 1 + this.stackOffset)
    span.setTag('_tracestep_stack', stack)
    span.setTag('_tracestep_lang', 'nodejs')
    span.setTag('_tracestep_execpath', dirname(require.main.filename))
    return span
  }

  inject(spanContext: opentracing.SpanContext | opentracing.Span, format: string, carrier: any): void {
    this.tracer.inject(spanContext, format, carrier)
  }

  extract(format: string, carrier: any): opentracing.SpanContext | null { 
    return this.tracer.extract(format, carrier)
  }
}