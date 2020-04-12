export type Trace = {
  traceID: string
  spans: Span[]
}

export type Span = {
  traceID: string
  spanID: string
  parentSpanID?: string
  serviceName: string
  startTime: number
  tags: Tag[]
  processTags: Tag[]
  logs: LogPoint[]
  stacktrace: StackTrace
}

export type StackTrace = {
  stackFrames: StackFrame[]
}

export type StackFrame = {
  filename: string
  line: number
}

export type Tag = {
  key: string
  value: string
  type: string
}
 
export type TraceResponse = {
  findTrace: Trace
}

export type LogPoint = {
  timestamp: number
  fields: LogPointField[]
}

export type LogPointField = {
  key: string
  type: string
  value: string
}