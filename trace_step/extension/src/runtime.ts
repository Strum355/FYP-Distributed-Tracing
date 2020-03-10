import { EventEmitter } from 'events'
import { readFileSync } from 'fs'
import { join } from 'path'
import * as vscode from 'vscode'
import { StackFrame, Trace } from './types'

export class Runtime extends EventEmitter {
  // a stack of source file paths to step forward and back
  // may contain duplicates if more than one stack frame per file
  public sourceFileStack: string[] = []
  public framesStack: StackFrame[] = []
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
    
    await this.loadNextSpan()
    this.step(false)
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

  private async loadNextSpan() {
    if(this.spanIdx + 1 == this.trace!!.spans.length) {
      this.sendEvent('stopOnStep')
      vscode.window.showInformationMessage('Reached final span of trace')
      return false
    }

    this.spanIdx++
    const span = this.trace!!.spans[this.spanIdx]
    const newFramesCount = span.stacktrace.stackFrames.length
    for(let frame of span.stacktrace.stackFrames) {
      // TODO: trim common prefix/substr?
      this.sourceFileStack.push(this.getPathFromStackFrame(await this.getMappingPath(span.serviceName), frame))
      this.framesStack.push(frame)
    }

    return true
  }
  
  private getPathFromStackFrame(mappingPath: string, stack: StackFrame): string {
    // this is a UNIX Only house!
    if(stack.filename.startsWith('/')) {
      return stack.filename
    }

    const localPath = join(mappingPath, stack.filename)
    return localPath
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
      this.loadSource(this.sourceFileStack[this.stackIdx])
      this.currentLine = this.framesStack[this.stackIdx].line
      this.fireEventsForLine()
    } else {
      if(this.stackIdx === 0) {
        this.fireEventsForLine()
        return false
      }
      this.stackIdx--
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