export type Trace = {
  traceID: string
  spans: Span[]
}

export type Span = {
  traceID: string
  spanID: string
  parentSpanID: string
  duration: number
  startTime: number
  operationName: string
  serviceName: string
  logs: LogPoint[]
  tags: Tag[]
}

export type Tag = {
  key: string
  value: string
}

export type LogPoint = {
  timestamp: number
  fields: {key: string, value: string}[]
}