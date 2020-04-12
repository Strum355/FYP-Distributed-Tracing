import * as opentracing from 'opentracing';
export declare class TraceWrapper extends opentracing.Tracer {
    private tracer;
    private stackOffset;
    constructor(tracer: opentracing.Tracer, stackOffset: number);
    startSpan(name: string, options?: opentracing.SpanOptions): opentracing.Span;
    inject(spanContext: opentracing.SpanContext | opentracing.Span, format: string, carrier: any): void;
    extract(format: string, carrier: any): opentracing.SpanContext | null;
}
