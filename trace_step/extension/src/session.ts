import ApolloClient from 'apollo-boost'
import gql from 'graphql-tag'
import * as vscode from 'vscode'
import { Handles, InitializedEvent, LoggingDebugSession, Scope, StoppedEvent, Thread } from 'vscode-debugadapter'
import { DebugProtocol } from 'vscode-debugprotocol'
import { Runtime } from './runtime'
import { Tag, TraceResponse } from "./types"
const { Subject } = require('await-notify')

interface launchRequestArguments extends DebugProtocol.LaunchRequestArguments {
  backendUrl: string
  traceID: string
}

export class DebugAdapter extends LoggingDebugSession {
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

		this.runtime.on('stopOnStep', () => {
      console.log('[EVENT] stopOnStep')
			this.sendEvent(new StoppedEvent('step', DebugAdapter.THREAD_ID));
    });
  }

  protected threadsRequest(response: DebugProtocol.ThreadsResponse) {
    console.log(`[DEBUGGER] threads request`)
    response.body = {
      threads: [
        new Thread(DebugAdapter.THREAD_ID, "ebic")
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
    
    let tagSet: Tag[] = []
    if(ref === "tags") {
      tagSet = this.runtime.getSpanTags() || []
    } else if(ref === "baggage") {
      tagSet = this.runtime.getBaggageTags() || []
    } else if(ref === "process") {
      tagSet = this.runtime.getProcessTags() || []
    }

    response.body = {
      variables: tagSet.map(t => ({
        name: t.key,
        value: t.value,
        type: t.type,
        variablesReference: 0
      }))
    }

    this.sendResponse(response)
  }

  protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, args: DebugProtocol.StackTraceArguments): void {
    console.log(`[DEBUGGER] stacktrace request: ${JSON.stringify(args)}`)
		const startFrame = typeof args.startFrame === 'number' ? args.startFrame : 0;
		const maxLevels = typeof args.levels === 'number' ? args.levels : 1000;
		const endFrame = startFrame + maxLevels;

    const stack = this.runtime.getStack((s: string): string => { 
      return this.convertDebuggerPathToClient(s)
    }).reverse()
    
		response.body = {
			stackFrames: stack,
			totalFrames: stack.length,
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
    DebugAdapter.args = args
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
                parentSpanID
                serviceName
                operationName
                stacktrace {
                  stackFrames {
                    packageName
                    filename
                    line
                    shouldResolve
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
    await this.runtime.stepForward()
    this.sendResponse(response)
  }

  protected async stepBackRequest(response: DebugProtocol.StepBackResponse, args: DebugProtocol.StepBackArguments) {
    await this.runtime.stepBack()
    this.sendResponse(response)
  }

  protected async stepInRequest(response: DebugProtocol.StepInResponse, args: DebugProtocol.StepInArguments, request?: DebugProtocol.StepInRequest) {
    await this.runtime.stepForward()
    this.sendResponse(response)
  }

  protected async stepOutRequest(response: DebugProtocol.StepOutResponse, args: DebugProtocol.StepOutArguments, request?: DebugProtocol.StepOutRequest) {
    await this.runtime.stepForward()
    this.sendResponse(response)
  }

  protected pauseRequest(response: DebugProtocol.PauseResponse, args: DebugProtocol.PauseArguments, request?: DebugProtocol.PauseRequest): void {
    this.sendResponse(response)
  }
}