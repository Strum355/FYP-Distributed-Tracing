import ApolloClient from 'apollo-boost'
import gql from 'graphql-tag'
import { basename } from 'path'
import * as vscode from 'vscode'
import { Breakpoint, BreakpointEvent, InitializedEvent, LoggingDebugSession, OutputEvent, Source, StackFrame, StoppedEvent, TerminatedEvent, Thread } from 'vscode-debugadapter'
import { DebugProtocol } from 'vscode-debugprotocol'
import { Runtime } from './runtime'
import { TraceResponse } from "./types"
const { Subject } = require('await-notify')

interface launchRequestArguments extends DebugProtocol.LaunchRequestArguments {
  mainPath: string
  backendUrl: string
  traceID: string
}

export class DebugSession extends LoggingDebugSession {
  private static THREAD_ID = 1
  private static args: launchRequestArguments

  private runtime: Runtime
  private configurationDone = new Subject()

  public constructor() {
    super()
    this.setDebuggerLinesStartAt1(false)
    this.setDebuggerColumnsStartAt1(false)

    this.runtime = new Runtime()

    this.runtime.on('stopOnEntry', () => {
      console.log('[EVENT] stopOnEntry')
      this.sendEvent(new StoppedEvent('entry', DebugSession.THREAD_ID))
    })
		this.runtime.on('stopOnStep', () => {
      console.log('[EVENT] stopOnStep')
			this.sendEvent(new StoppedEvent('step', DebugSession.THREAD_ID));
    });
		this.runtime.on('stopOnBreakpoint', () => {
			console.log('[EVENT] stopOnBreakpoint')
			this.sendEvent(new StoppedEvent('breakpoint', DebugSession.THREAD_ID));
		});
		this.runtime.on('stopOnDataBreakpoint', () => {
			console.log('[EVENT] stopOnDataBreakpoint')
			this.sendEvent(new StoppedEvent('data breakpoint', DebugSession.THREAD_ID));
		});
		this.runtime.on('stopOnException', () => {
			console.log('[EVENT] stopOnException')
			this.sendEvent(new StoppedEvent('exception', DebugSession.THREAD_ID));
		});
    this.runtime.on('output', (text, filePath, line, column) => {
      console.log('[EVENT] output')
      const e: DebugProtocol.OutputEvent = new OutputEvent(`${text}\n`)
      e.body.source = this.createSource(filePath)
      e.body.line = this.convertDebuggerLineToClient(line)
      e.body.line = this.convertDebuggerColumnToClient(column)
      this.sendEvent(e)
    })

    this.runtime.on('break', () => {
      console.log(`[DEBUGGER] got break event`)
      this.sendEvent(new BreakpointEvent('new', new Breakpoint(true, 26, 10, new Source('main.go', DebugSession.args.mainPath))))
    })
    
    this.runtime.on('end', () => {
      this.sendEvent(new TerminatedEvent())
    })
  }

  protected breakpointLocationsRequest(response: DebugProtocol.BreakpointLocationsResponse, args: DebugProtocol.BreakpointLocationsArguments, request?: DebugProtocol.BreakpointLocationsRequest) {
    response.body.breakpoints = [
      {line: this.runtime.line(), column: 10}
    ]
    this.sendResponse(response)
  }

  protected threadsRequest(response: DebugProtocol.ThreadsResponse) {
    response.body = {
      threads: [
        new Thread(DebugSession.THREAD_ID, "ebic")
      ]
    }
    this.sendResponse(response)
  }
      
  protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments) {
    console.log(`[DEBUGGER] init args ${JSON.stringify(args)}`)
    response.body = response.body || {}
    response.body.supportsConfigurationDoneRequest = true
    response.body.supportsStepBack = true
    response.body.supportsBreakpointLocationsRequest = true

    this.sendResponse(response)
    this.sendEvent(new InitializedEvent())
  }

  protected scopesRequest(response: DebugProtocol.ScopesResponse, args: DebugProtocol.ScopesArguments, request?: DebugProtocol.ScopesRequest): void {
    response.body.scopes = []
    this.sendResponse(response)
  }

  protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments): void {

		const startFrame = typeof args.startFrame === 'number' ? args.startFrame : 0;
		const maxLevels = typeof args.levels === 'number' ? args.levels : 1000;
		const endFrame = startFrame + maxLevels;

		//const stk = this.runtime.stack(startFrame, endFrame);

		response.body = {
			stackFrames: [
        new StackFrame(0, "test",
          new Source(
            basename(DebugSession.args.mainPath),
            this.convertDebuggerPathToClient(DebugSession.args.mainPath),
            undefined,
            undefined,
            'sample-text')
          , this.runtime.line()),
      ],
			totalFrames: 1,
		};
		this.sendResponse(response);
	}

  protected configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, args: DebugProtocol.ConfigurationDoneArguments) {
    super.configurationDoneRequest(response, args)
    console.log(`[DEBUGGER] config args ${JSON.stringify(args)}`)
    this.configurationDone.notify()
  }

  protected async launchRequest(response: DebugProtocol.LaunchResponse, args: launchRequestArguments) {
    await this.configurationDone.wait(1000)
    DebugSession.args = args
    console.log(`[DEBUGGER] launch args ${JSON.stringify(args)}`)
    const client = new ApolloClient({
      uri: args.backendUrl
    })

    const traceID = await vscode.window.showInputBox({
      placeHolder: "Please enter the Trace ID",
      prompt: "Please enter the Trace ID",
      ignoreFocusOut: true,
    })

    const resp = await client.query<TraceResponse>({
      query: gql`
        query findTrace($traceID: String!) {
          findTrace(traceID: $traceID) {
            traceID
            spans {
              spanID
              startTime
              stacktrace {
                stackFrames {
                  packageName
                  filename
                  line
                }
              }
              tags {
                key
                value
              }
            }  
          }
        }`,
      variables: {
        traceID: traceID,
      }
    })
    console.log(`[DEBUGGER] GraphQL Response: ${JSON.stringify(resp, null, 4)}`)
    this.runtime.start(args.mainPath, resp.data.findTrace)
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