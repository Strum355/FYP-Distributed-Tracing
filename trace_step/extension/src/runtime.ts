import { EventEmitter } from 'events'
import { readFileSync } from 'fs'
import { Trace } from './types'

export class Runtime extends EventEmitter {
  private sourceFile: string = ''
  private sourceLines: string[] = []
  private currentLine: number = 0
  private trace?: Trace

  constructor() {
    super()
  }

  public start(program: string, trace: Trace) {
    this.trace = trace

    this.trace.spans = this.trace.spans.sort((a, b) => a.startTime < b.startTime ? -1 : 1)

    console.log(`[RUNTIME] started ${program}`)
    for(let span of trace.spans) {
      console.log(`[RUNTIME] span trace:\n${span.startTime} ${span.spanID}\n${span.tags.filter(tag => tag.key == "_tracestep_stack")[0].value}`)
    }
    this.loadSource(program)
    this.step(false)
  }

  private loadSource(file: string) {
    if(this.sourceFile !== file) {
      this.sourceFile = file
      this.sourceLines = readFileSync(this.sourceFile).toString().split('\n')
    }
  }

  private parseStack(spanIdx: number) {
    let span = this.trace!!.spans[spanIdx]
    const stack = span.tags.filter(tag => tag.key == "_tracestep_stack")[0].value

    const stackLines = stack.split("\n").reverse().map(s => s.trimLeft())
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