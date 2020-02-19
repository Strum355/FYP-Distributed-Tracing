export type Trace = {
  traceID: string
  spans: Span[]
}

export type Span = {
  traceID: string
  spanID: string
  parentSpanID?: string
  startTime: number
  tags: Tag[]
}

export type Tag = {
  key: string
  value: string
}
 
export type TraceResponse = {
  findTrace: Trace
}