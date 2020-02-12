import { EventEmitter } from 'events'
import { readFileSync } from 'fs'

export class Runtime extends EventEmitter {
  private sourceFile: string = ''
  private sourceLines: string[] = []
  private currentLine: number = 0

  constructor() {
    super()
  }

  public start(program: string) {
    console.log(`[RUNTIME] started ${program}`)
    this.loadSource(program)
    this.step(false)
  }

  private loadSource(file: string) {
    if(this.sourceFile !== file) {
      this.sourceFile = file
      this.sourceLines = readFileSync(this.sourceFile).toString().split('\n')
    }
  }

  public step(reverse: boolean): boolean {
    if(!reverse) {
      console.log(`[RUNTIME] source lines ${this.sourceLines.length}\n\tChecking forward line ${this.currentLine}\n\t${this.sourceLines[this.currentLine]}`)
      for(let ln = this.currentLine; ln < this.sourceLines.length; ln++) {
        if(this.fireEventsForLine(ln)) {
          this.currentLine = ln+1
          return true
        }
      }
    } else {
      console.log(`[RUNTIME] source lines ${this.sourceLines.length}\n\tChecking back line ${this.currentLine}\n\t${this.sourceLines[this.currentLine]}`)
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