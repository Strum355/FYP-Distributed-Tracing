import { EventEmitter } from 'events'
import { readFileSync } from 'fs'

export class Runtime extends EventEmitter {
  private sourceFile: string = ''
  private sourceLines: string[] = []
  private currentLine: number = -1

  constructor() {
    super()
  }

  public start(program: string) {
    this.loadSource(program)
    this.step(false)
  }

  private loadSource(file: string) {
    if(this.sourceFile !== file) {
      this.sourceFile = file
      this.sourceLines = readFileSync(this.sourceFile).toString().split('\n')
    }
  }

  public step(reverse: boolean) {
    this.run()
  }

  private run() {
      
  }
}