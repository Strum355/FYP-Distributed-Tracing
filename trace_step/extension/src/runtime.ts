import { EventEmitter } from 'events'
import { existsSync } from 'fs'
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
  // the trace we're operating on
  private trace?: Trace
  // mapping of service name to main path
  private mapping: Map<string, string> = new Map()
  // holds all baggage KV from all spans
  private baggageKV: Tag[] = []

  public async start(trace: Trace) {
    this.trace = trace
    
    this.trace.spans = this.trace.spans.sort((a, b) => a.startTime < b.startTime ? -1 : 1)

    this.trace.spans = this.trace.spans.map(s => {
      s.stacktrace.stackFrames = s.stacktrace.stackFrames.reverse()
      return s
    })
    console.log(`[RUNTIME] started runtime`)
    console.log(`[RUNTIME] GraphQL Response: ${JSON.stringify(this.trace, null, 4)}`)
    
    this.collectBaggageKV()

    await this.loadNextSpan()
    this.stepForward()
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

    await vscode.workspace.getConfiguration('tracestep.mappings').update(service, mapping)

    this.mapping.set(service, mapping)

    return mapping
  }

  private getSpanIdx(): number {
    return this.stackIdx === -1 ? -1 : this.spanIdxStackMapping[this.stackIdx]
  }

  public getSpanTags(): Tag[] | undefined {
    return this.trace?.spans[this.getSpanIdx()].tags.filter(t => !t.key.startsWith('_tracestep'))
  }

  public getProcessTags(): Tag[] | undefined {
    return this.trace?.spans[this.getSpanIdx()].processTags
  }
  
  public getCurrentOperationName(): string | undefined {
    return this.trace?.spans[this.getSpanIdx()].operationName
  }

  public getCurrentServiceName(): string | undefined {
    return this.trace?.spans[this.getSpanIdx()].serviceName
  }

  public getBaggageTags(): Tag[] | undefined {
    return this.baggageKV
  }

  private async loadNextSpan(): Promise<boolean> {
    if(this.getSpanIdx() + 1 == this.trace!!.spans.length) {
      vscode.window.showInformationMessage('Reached final span of trace')
      return false
    }

    const nextSpanIdx = this.getSpanIdx() + 1
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
  
  /**
   * Resolves the path of a file on the users machine based on stack frame 
   * information. If the package name is null and the path is absolute, the 
   * path is returned unchanged (not the best but works locally (^: ).
   * If the package name is not null and the path is absolute, the path
   * must be further resolved based on the language by filePathResolver.
   * If the package name is null and the path is not absolute, the
   * mapping path is prefixed with the filepath to give the path in the
   * project folder. 
   * 
   * @param mappingPath the path of the project root folder
   * @param stack the current stack frame the path is associated with
   * @param spanIndex the index of the span this stack frame is associated with
   */
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

  /**
   * Resolves the path of a file on the users local machine depending on the programming
   * language the span associated with this filepath is. It may prompt the user for additional
   * information, such as for the GOPATH when the language is Go
   * 
   * @param filepath the path of the unresolved file
   * @param spanIndex the index of the span to get what language we are resolving for
   */
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

  public async stepForward() {
    if(this.stackIdx === this.sourceFileStack.length-1) {
      const hitEnd = await this.loadNextSpan()
      if(hitEnd) {
        this.sendStopOnStepEvent()
        return
      }
    }
    this.stackIdx++
    this.popupOnFileNotExists()
    this.sendStopOnStepEvent()
  }

  public async stepBack() {
    if(this.stackIdx === 0) {
      this.sendStopOnStepEvent()
      return
    }
    this.stackIdx--
    this.popupOnFileNotExists()
    this.sendStopOnStepEvent()
  }

  private popupOnFileNotExists() {
    if(!existsSync(this.sourceFileStack[this.stackIdx])) vscode.window.showErrorMessage(`File ${this.sourceFileStack[this.stackIdx]} not found when stepping.`)
  }

  public line(): number {
    return this.framesStack[this.stackIdx].line
  }

  private sendStopOnStepEvent() {
    this.sendEvent('stopOnStep')
  }

  private sendEvent(event: string, ... args: any[]) {
		setImmediate(_ => {
			this.emit(event, ...args);
		});
	}
}