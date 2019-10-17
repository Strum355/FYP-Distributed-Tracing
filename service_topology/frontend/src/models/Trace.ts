export type Trace = {

}

export type Span = {
  duration: number
  startTime: number
  spanID: string
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