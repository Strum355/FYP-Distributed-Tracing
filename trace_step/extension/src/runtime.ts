import { EventEmitter } from 'events'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as vscode from 'vscode'
import { StackFrame, Tag, Trace } from './types'

export class Runtime extends EventEmitter {
  // a stack of source file paths to step forward and back
  // may contain duplicates if more than one stack frame per file
  public sourceFileStack: string[] = []
  public framesStack: StackFrame[] = []
  // keeps track of the span associated with a stack index
  private spanIdxStackMapping: number[] = []
  // where in the stacks we're at
  public stackIdx: number = -1
  // current files source split on newline
  private sourceLines: string[] = []
  // current line we're on 
  private currentLine: number = 0
  // the trace we're operating on
  private trace?: Trace
  // index of the current span
  private spanIdx: number = -1
  // main path of the (entry?) service
  private basePath = ''
  // mapping of service name to main path
  private mapping: Map<string, string> = new Map()
  // holds all baggage KV from all spans
  private baggageKV: Tag[] = []

  constructor() {
    super()
  }

  public async start(trace: Trace) {
    this.trace = trace
    
    this.trace.spans = this.trace.spans.sort((a, b) => a.startTime < b.startTime ? -1 : 1)

    this.basePath = await this.getMappingPath(trace.spans[0].serviceName)

    this.trace.spans = this.trace.spans.map(s => {
      s.stacktrace.stackFrames = s.stacktrace.stackFrames.reverse()
      return s
    })
    console.log(`[RUNTIME] started ${this.basePath}`)
    console.log(`[RUNTIME] GraphQL Response: ${JSON.stringify(this.trace, null, 4)}`)
    
    this.collectBaggageKV()

    await this.loadNextSpan()
    this.step(false)
  }

  // Baggage KV are stored as a log point in the span they were created on.
  // Theyre only propagated and can be queried on the span context but otherwise
  // arent attached to other spans
  private collectBaggageKV() {
    this.trace?.spans.filter(s => s.logs.length > 0).forEach(s => {
      s.logs.forEach(log => {
        this.baggageKV.push({
          key: log.fields.filter(f => f.key === "key")[0].value,
          value: log.fields.filter(f => f.key === "value")[0].value,
          type: "string"
        })
      })
    })
  }

  private async getMappingPath(service: string): Promise<string> {
    if(this.mapping.has(service)) {
      return this.mapping.get(service)!!
    }

    const mappingConf = vscode.workspace.getConfiguration('tracestep.mappings').get(service) as string | null
    
    const mapping = mappingConf == null ? (await vscode.window.showInputBox({
      prompt: `Please enter absolute path to base of ${service}.`,
      ignoreFocusOut: true,
    }))!! : mappingConf!!

    this.mapping.set(service, mapping)

    return mapping
  }

  public getSpanTags(): Tag[] | undefined {
    return this.trace?.spans[this.spanIdx].tags.filter(t => !t.key.startsWith('_tracestep'))
  }

  public getProcessTags(): Tag[] | undefined {
    return this.trace?.spans[this.spanIdx].processTags
  }
  
  public getCurrentOperationName(): string | undefined {
    return this.trace?.spans[this.spanIdx].operationName
  }

  public getCurrentServiceName(): string | undefined {
    return this.trace?.spans[this.spanIdx].serviceName
  }

  public getBaggageTags(): Tag[] | undefined {
    return this.baggageKV
  }

  private async loadNextSpan() {
    if(this.spanIdx + 1 == this.trace!!.spans.length) {
      this.sendEvent('stopOnStep')
      vscode.window.showInformationMessage('Reached final span of trace')
      return false
    }

    const nextSpanIdx = this.spanIdx + 1
    const span = this.trace!!.spans[nextSpanIdx]
    const newFramesCount = span.stacktrace.stackFrames.length
    for(let frame of span.stacktrace.stackFrames) {
      // TODO: trim common prefix/substr?
      this.sourceFileStack.push(await this.getPathFromStackFrame(await this.getMappingPath(span.serviceName), frame, nextSpanIdx))
      this.framesStack.push(frame)
      this.spanIdxStackMapping.push(nextSpanIdx)
    }

    return true
  }
  
  private async getPathFromStackFrame(mappingPath: string, stack: StackFrame, spanIndex: number): Promise<string> {
    if(stack.packageName != null && stack.filename.startsWith('/')) {
      return await this.filePathResolver(stack.filename, spanIndex)
    }
    
    // this is a UNIX Only house!
    if(stack.filename.startsWith('/')) {
      return stack.filename
    }

    const localPath = join(mappingPath, stack.filename)
    return localPath
  }

  private async filePathResolver(filepath: string, spanIndex: number): Promise<string> {
    const lang = this.trace!!.spans[spanIndex].tags.filter(t => t.key === "_tracestep_lang")[0].value

    // only need to prepend GOPATH
    if(lang === "go") {
      let gopath = vscode.workspace.getConfiguration('tracestep').get('gopath') as string | null | undefined
      if(gopath == null) {
        gopath = await vscode.window.showInputBox({
          prompt: 'Please input value of GOPATH.'
        })
        await vscode.workspace.getConfiguration('tracestep').update('gopath', gopath)
      }
      return gopath+filepath
    }
    return filepath
  }

  private loadSource(file: string, idx: number=this.stackIdx) {
    if(this.sourceFileStack[idx] !== file || this.sourceLines.length === 0) {
      this.sourceFileStack[idx] = file
      this.sourceLines = readFileSync(this.sourceFileStack[idx]).toString().split('\n')
    }
  }

  public async step(reverse: boolean): Promise<boolean> {
    if(!reverse) {
      if(this.stackIdx === this.sourceFileStack.length-1) {
        await this.loadNextSpan()
      }
      this.stackIdx++
      if(this.spanIdxStackMapping[this.stackIdx] !== this.spanIdxStackMapping[this.stackIdx-1]) {
        this.spanIdx++
      }
      this.loadSource(this.sourceFileStack[this.stackIdx])
      this.currentLine = this.framesStack[this.stackIdx].line
      this.fireEventsForLine()
    } else {
      if(this.stackIdx === 0) {
        this.fireEventsForLine()
        return false
      }
      this.stackIdx--
      if(this.spanIdxStackMapping[this.stackIdx] !== this.spanIdxStackMapping[this.stackIdx+1]) {
        this.spanIdx--
      }
      this.loadSource(this.sourceFileStack[this.stackIdx])
      this.currentLine = this.framesStack[this.stackIdx].line
      this.fireEventsForLine()
    }
    return true
  }

  public line(): number {
    return this.currentLine
  }

  private fireEventsForLine() {
    this.sendEvent('stopOnStep')
  }

  private sendEvent(event: string, ... args: any[]) {
		setImmediate(_ => {
			this.emit(event, ...args);
		});
	}
}