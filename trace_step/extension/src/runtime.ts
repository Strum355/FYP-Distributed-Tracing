import { EventEmitter } from 'events'
import { readFileSync } from 'fs'
import { join } from 'path'
import { window } from 'vscode'
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

  public start(basePath: string, trace: Trace) {
    this.trace = trace
    this.basePath = basePath

    this.trace.spans = this.trace.spans.sort((a, b) => a.startTime < b.startTime ? -1 : 1)
    this.trace.spans = this.trace.spans.map(s => {
      s.stacktrace.stackFrames = s.stacktrace.stackFrames.reverse()
      return s
    })
    console.log(`[RUNTIME] started ${basePath}`)
    console.log(`[RUNTIME] GraphQL Response: ${JSON.stringify(this.trace, null, 4)}`)
    
    this.loadNextSpan()
    this.step(false)
  }

  private loadNextSpan() {
    if(this.spanIdx + 1 == this.trace!!.spans.length) {
      this.sendEvent('end')
      window.showInformationMessage('Reached final span of trace')
      return false
    }
    this.spanIdx++
    const span = this.trace!!.spans[this.spanIdx]
    const newFramesCount = span.stacktrace.stackFrames.length
    for(let frame of span.stacktrace.stackFrames) {
      // TODO: trim common prefix/substr?
      this.sourceFileStack.push(this.getPathFromStackFrame(frame))
      this.framesStack.push(frame)
    }

    /* this.stackIdx++
    this.loadSource(this.sourceFileStack[this.sourceFileStack.length-newFramesCount]) */

    return true
  }
  
  private getPathFromStackFrame(stack: StackFrame): string {
    //const sParentFolder = dirname(stack.filename)
    //const dParentFolder = basename(this.basePath)

    //const localPath = this.basePath.substring(0, this.basePath.lastIndexOf(sParentFolder)) + stack.filename
    const localPath = join(this.basePath, stack.filename)
    return localPath
  }

  private loadSource(file: string, idx: number=this.stackIdx) {
    if(this.sourceFileStack[idx] !== file || this.sourceLines.length === 0) {
      this.sourceFileStack[idx] = file
      this.sourceLines = readFileSync(this.sourceFileStack[idx]).toString().split('\n')
    }
  }

  public step(reverse: boolean): boolean {
    if(!reverse) {
      if(this.stackIdx === this.sourceFileStack.length-1) {
        this.loadNextSpan()
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