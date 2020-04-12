import ApolloClient from 'apollo-boost'
import gql from 'graphql-tag'
import { basename } from 'path'
import * as vscode from 'vscode'
import { Breakpoint, BreakpointEvent, Handles, InitializedEvent, LoggingDebugSession, OutputEvent, Scope, Source, StackFrame, StoppedEvent, TerminatedEvent, Thread } from 'vscode-debugadapter'
import { DebugProtocol } from 'vscode-debugprotocol'
import { Runtime } from './runtime'
import { TraceResponse } from "./types"
const { Subject } = require('await-notify')

interface launchRequestArguments extends DebugProtocol.LaunchRequestArguments {
  backendUrl: string
  traceID: string
}

export class DebugSession extends LoggingDebugSession {
  private static THREAD_ID = 1
  private static args: launchRequestArguments

  private runtime: Runtime
  private configurationDone = new Subject()
  private variableHandles = new Handles<string>()

  private tagsRef = this.variableHandles.create("tags")
  private processRef = this.variableHandles.create("process")
  private baggageRef = this.variableHandles.create("baggage")

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
      this.sendEvent(new BreakpointEvent('new', new Breakpoint(true, 26, 10, new Source('main.go', this.runtime.sourceFileStack[this.runtime.stackIdx]))))
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
    console.log(`[DEBUGGER] scopes request: ${JSON.stringify(args)}`)
    response.body = {
      scopes: [
        new Scope("Span Tags", this.tagsRef, false),
        new Scope("Process Tags", this.processRef, false),
        new Scope("Baggage", this.baggageRef, false)
      ]
    }
    this.sendResponse(response)
  }

  protected variablesRequest(response: DebugProtocol.VariablesResponse, args: DebugProtocol.VariablesArguments, request?: DebugProtocol.VariablesRequest): void {
    console.log(`[DEBUGGER] variables request: ${JSON.stringify(args)}`)
    const ref = this.variableHandles.get(args.variablesReference)
    console.log(`[DEBUGGER] ref ${ref}`)
    response.body = {
      variables: (ref === "tags" ? this.runtime.getSpanTags() : (ref === "baggage" ? this.runtime.getBaggageTags() : this.runtime.getProcessTags()))?.map(t => ({
        name: t.key,
        value: t.value,
        type: t.type,
        variablesReference: 0
      })) || []
    }

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
            basename(this.runtime.sourceFileStack[this.runtime.stackIdx]),
            this.convertDebuggerPathToClient(this.runtime.sourceFileStack[this.runtime.stackIdx]),
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

    try {
      const resp = await client.query<TraceResponse>({
        query: gql`
          query findTrace($traceID: String!) {
            findTrace(traceID: $traceID) {
              traceID
              spans {
                spanID
                startTime
                serviceName
                stacktrace {
                  stackFrames {
                    filename
                    line
                  }
                }
                tags {
                  key
                  value
                  type
                }
                processTags {
                  key
                  value
                  type
                }
                logs(eventType: "baggage") {
                  fields {
                    key
                    type
                    value
                  }
                }
              }  
            }
          }`,
        variables: {
          traceID: traceID,
        }
      })
      this.runtime.start(resp.data.findTrace)
      this.sendResponse(response)
    } catch(e) {
      response.success = false
      response.message = e.toString()
      this.sendResponse(response)
    }
  }

  protected async nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments) {
    await this.runtime.step(false)
    this.sendResponse(response)
  }

  protected async stepBackRequest(response: DebugProtocol.StepBackResponse, args: DebugProtocol.StepBackArguments) {
    await this.runtime.step(true)
    this.sendResponse(response)
  }

  protected stepInRequest(response: DebugProtocol.StepInResponse, args: DebugProtocol.StepInArguments, request?: DebugProtocol.StepInRequest) {
    this.sendResponse(response)
  }

  protected stepOutRequest(response: DebugProtocol.StepOutResponse, args: DebugProtocol.StepOutArguments, request?: DebugProtocol.StepOutRequest) {
    this.sendResponse(response)
  }

  protected pauseRequest(response: DebugProtocol.PauseResponse, args: DebugProtocol.PauseArguments, request?: DebugProtocol.PauseRequest): void {
    this.sendResponse(response)
  }

  private createSource(path: string): Source {
    return new Source(basename(path), this.convertDebuggerPathToClient(path), undefined, undefined, 'banana')
  }
}