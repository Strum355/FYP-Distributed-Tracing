import { basename } from 'path'
import { Breakpoint, BreakpointEvent, InitializedEvent, LoggingDebugSession, OutputEvent, Source, TerminatedEvent } from 'vscode-debugadapter'
import { DebugProtocol } from 'vscode-debugprotocol'
import { Runtime } from './runtime'
const { Subject } = require('await-notify')

interface launchRequestArguments extends DebugProtocol.LaunchRequestArguments {
  mainPath: string
}

export class DebugSession extends LoggingDebugSession {
  private static THREAD_ID = 1

  private runtime: Runtime
  private configurationDone = new Subject()

  public constructor() {
    super()
    this.setDebuggerLinesStartAt1(false)
    this.setDebuggerColumnsStartAt1(false)

    this.runtime = new Runtime()

    this.runtime.on('output', (text, filePath, line, column) => {
      const e: DebugProtocol.OutputEvent = new OutputEvent(`${text}\n`)
      e.body.source = this.createSource(filePath)
      e.body.line = this.convertDebuggerLineToClient(line)
      e.body.line = this.convertDebuggerColumnToClient(column)
      this.sendEvent(e)
    })

    this.runtime.on('break', () => {
      console.log(`[DEBUGGER] got break event`)
      this.sendEvent(new BreakpointEvent('thats why', new Breakpoint(true, 26, 10, new Source('main.go', '/home/noah/UCC/Year4/FYP-2020_Distributed-Tracing/trace_step/examples/exmpl1/main.go'))))
    })
    
    this.runtime.on('end', () => {
      this.sendEvent(new TerminatedEvent())
    })
  }
      
  protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments) {
    console.log(`[DEBUGGER] init args ${JSON.stringify(args)}`)
    response.body = response.body || {}
    response.body.supportsConfigurationDoneRequest = true
    response.body.supportsStepBack = true
    this.sendResponse(response)
    this.sendEvent(new InitializedEvent())
  }

  protected configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, args: DebugProtocol.ConfigurationDoneArguments) {
    super.configurationDoneRequest(response, args)
    console.log(`[DEBUGGER] config args ${JSON.stringify(args)}`)
    this.configurationDone.notify()
  }

  protected async launchRequest(response: DebugProtocol.LaunchResponse, args: launchRequestArguments) {
    await this.configurationDone.wait(1000)
    console.log(`[DEBUGGER] launch args ${JSON.stringify(args)}`)
    this.runtime.start(args.mainPath)
    this.sendResponse(response)
  }

  protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments) {
    console.log(`[DEBUGGER] next args ${JSON.stringify(args)}`)
    this.runtime.step(false)
    this.sendResponse(response)
  }

  protected stepBackRequest(response: DebugProtocol.StepBackResponse, args: DebugProtocol.StepBackArguments) {
    this.runtime.step(true)
    console.log(`[DEBUGGER] stepback args ${JSON.stringify(args)}`)
    this.sendResponse(response)
  }

  protected pauseRequest(response: DebugProtocol.PauseResponse, args: DebugProtocol.PauseArguments, request?: DebugProtocol.Request): void {
    console.log(`[DEBUGGER] pause args ${JSON.stringify(args)}`)
    this.sendResponse(response)
  }

  private createSource(path: string): Source {
    return new Source(basename(path), this.convertDebuggerPathToClient(path), undefined, undefined, 'banana')
  }
}