import * as Net from 'net'
import * as vscode from 'vscode'
import { DebugSession } from './session'

export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.commands.registerCommand('extension.tracestep.getTraceID', () => {
		return vscode.window.showInputBox({
      placeHolder: "Please enter the Trace ID",
      prompt: "Please enter the Trace ID",
    })
  }))
  
  const config = new ConfigProvider()
  context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('tracestep', config))

  const factory = new AdapterFactory()
  context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('tracestep', factory))
  context.subscriptions.push(factory)
}

export function deactivate() {}

class ConfigProvider implements vscode.DebugConfigurationProvider {
  resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, config: vscode.DebugConfiguration, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration> {
    return config
  }
}

class AdapterFactory implements vscode.DebugAdapterDescriptorFactory {
  private server?: Net.Server

  createDebugAdapterDescriptor(session: vscode.DebugSession, exec: vscode.DebugAdapterExecutable | undefined): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
    if(!this.server) {
      this.server = Net.createServer(s => {
        const session = new DebugSession()
        session.setRunAsServer(true)
        console.log('[DEBUGGER] Starting server')
        session.start(s, s)
      }).listen(0)
    }
    return new vscode.DebugAdapterServer((this.server.address() as Net.AddressInfo).port)
  }

  dispose() {
    if(this.server) this.server.close()
  }
}
