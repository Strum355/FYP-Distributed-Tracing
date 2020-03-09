import { EventEmitter } from 'events'
import { readFileSync } from 'fs'
import { basename, dirname } from 'path'
import { StackFrame, Trace } from './types'

export class Runtime extends EventEmitter {
  // a stack of source file paths to step forward and back
  // may contain duplicates if more than one stack frame per file
  public sourceFileStack: string[] = []
  // where in the stacks we're at
  public stackIdx: number = 0
  // current files source split on newline
  private sourceLines: string[] = []
  // current line we're on 
  private currentLine: number = 0
  // the trace we're operating on
  private trace?: Trace
  // main path of the (entry?) service
  // 
  private mainPath = ''

  constructor() {
    super()
  }

  public start(mainPath: string, trace: Trace) {
    this.trace = trace
    this.mainPath = mainPath

    this.trace.spans = this.trace.spans.sort((a, b) => a.startTime < b.startTime ? -1 : 1)

    console.log(`[RUNTIME] started ${mainPath}`)
    console.log(`[RUNTIME] GraphQL Response: ${JSON.stringify(this.trace, null, 4)}`)
    
    const firstFrame = this.trace.spans[this.trace.spans.length-1].stacktrace.stackFrames.reverse()[0]
    const path = this.getPathFromStackFrame(this.trace.spans[0].stacktrace.stackFrames[0])
    this.loadSource(path)
    this.step(false)
  }

  //TODO: trim longest common prefix of previous stackframe 
  private getPathFromStackFrame(stack: StackFrame): string {
    const sParentFolder = dirname(stack.filename)
    const dParentFolder = basename(this.mainPath)

    const localPath = this.mainPath.substring(0, this.mainPath.lastIndexOf(sParentFolder)) + stack.filename
    return localPath
  }

  private loadSource(file: string) {
    if(this.sourceFileStack[this.stackIdx] !== file) {
      this.sourceFileStack[this.stackIdx] = file
      this.sourceLines = readFileSync(this.sourceFileStack[this.stackIdx]).toString().split('\n')
    }
  }

  public step(reverse: boolean): boolean {
    if(!reverse) {
      //console.log(`[RUNTIME] source lines ${this.sourceLines.length}\n\tChecking forward line ${this.currentLine}\n\t${this.sourceLines[this.currentLine]}`)
      for(let ln = this.currentLine; ln < this.sourceLines.length; ln++) {
        if(this.fireEventsForLine(ln)) {
          this.currentLine = ln+1
          return true
        }
      }
    } else {
      //console.log(`[RUNTIME] source lines ${this.sourceLines.length}\n\tChecking back line ${this.currentLine}\n\t${this.sourceLines[this.currentLine]}`)
      for(let ln = this.currentLine; ln >= 0; ln--) {
        if(this.fireEventsForLine(ln)) {
          this.currentLine = ln-1
          return true
        }
      }
    }
    this.sendEvent('end')
    return true
  }

  public line(): number {
    return this.currentLine
  }

  private fireEventsForLine(ln: number): boolean {
    const line = this.sourceLines[ln]
    
    if(line.length == 0) {
      return false
    }

    this.sendEvent('stopOnStep')

    return true
  }

  private sendEvent(event: string, ... args: any[]) {
		setImmediate(_ => {
			this.emit(event, ...args);
		});
	}
}