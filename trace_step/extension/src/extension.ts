import * as Net from 'net'
import * as vscode from 'vscode'
import { DebugAdapter } from './session'

export async function activate(context: vscode.ExtensionContext) {
  const config = new ConfigProvider()
  context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('tracestep', config))

  const factory = new AdapterDescriptorFactory()
  context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('tracestep', factory))
  context.subscriptions.push(factory)
}

export function deactivate() {}

class ConfigProvider implements vscode.DebugConfigurationProvider {
  resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, config: vscode.DebugConfiguration, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration> {
    return config
  }
}

class AdapterDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {
  private server?: Net.Server

  createDebugAdapterDescriptor(__: vscode.DebugSession, _: vscode.DebugAdapterExecutable | undefined): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
    if(!this.server) {
      this.server = Net.createServer(socket => {
        const session = new DebugAdapter()
        session.setRunAsServer(true)
        console.log('[DEBUGGER] Starting server')
        session.start(socket, socket)
      }).listen(0)
    }
    return new vscode.DebugAdapterServer((this.server.address() as Net.AddressInfo).port)
  }

  dispose() {
    if(this.server) this.server.close()
  }
}
