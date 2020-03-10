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

export const equalStackFrame = (s1: StackFrame, s2: StackFrame): boolean => {
  return s1.packageName === s2.packageName && 
    s1.filename === s2.filename &&
    s1.line == s2.line
}

export type Tag = {
  key: string
  value: string
}
 
export type TraceResponse = {
  findTrace: Trace
}