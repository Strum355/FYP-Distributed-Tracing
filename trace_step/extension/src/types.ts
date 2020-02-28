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
  stacktrace: StackTrace
}

export type StackTrace = {
  stackFrames: StackFrame[]
}

export type StackFrame = {
  packageName: string
  filename: string
  line: number
}

export type Tag = {
  key: string
  value: string
}
 
export type TraceResponse = {
  findTrace: Trace
}