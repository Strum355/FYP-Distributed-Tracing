export type Trace = {
  traceID: string
  spans: Span[]
}

export type Span = {
  traceID: string
  spanID: string
  parentSpanID?: string
  serviceName: string
  operationName: string
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
  packageName?: string
  filename: string
  line: number
  shouldResolve: boolean
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

export function equal(frame1: StackFrame, frame2: StackFrame): boolean {
  const equal = frame1.filename === frame2.filename &&
    frame1.line === frame2.line && 
    frame1.packageName === frame2.packageName
  return equal
}