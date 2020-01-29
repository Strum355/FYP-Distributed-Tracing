import { basename } from 'path'
import { InitializedEvent, LoggingDebugSession, OutputEvent, Source, TerminatedEvent } from 'vscode-debugadapter'
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

    this.runtime.on('end', () => {
      this.sendEvent(new TerminatedEvent())
    })
  }
      
  protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments) {
    response.body = response.body || {}
    response.body.supportsConfigurationDoneRequest = true
    response.body.supportsStepBack = true
    this.sendResponse(response)
    this.sendEvent(new InitializedEvent())
  }

  protected configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, args: DebugProtocol.ConfigurationDoneArguments) {
    super.configurationDoneRequest(response, args)
    this.configurationDone.notify()
  }

  protected async launchRequest(response: DebugProtocol.LaunchResponse, args: launchRequestArguments) {
    await this.configurationDone.wait(1000)
    console.log(`[DEBUGGER] args ${JSON.stringify(args)}`)
    this.runtime.start(args.mainPath)
    this.sendResponse(response)
  }

  protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments) {
    this.runtime.step(false)
    this.sendResponse(response)
  }

  protected stepBackRequest(response: DebugProtocol.StepBackResponse, args: DebugProtocol.StepBackArguments) {
    this.runtime.step(true)
    this.sendResponse(response)
  }

  private createSource(path: string): Source {
    return new Source(basename(path), this.convertDebuggerPathToClient(path), undefined, undefined, 'banana')
  }
}