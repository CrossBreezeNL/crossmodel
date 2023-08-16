/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as path from 'path';
// eslint-disable-next-line import/no-unresolved
import * as vscode from 'vscode';
import { ForkOptions, LanguageClient, LanguageClientOptions, ServerOptions, TransportKind } from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

// This function is called when the extension is activated.
export async function activate(context: vscode.ExtensionContext): Promise<void> {
   const workspacePath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
   if (!workspacePath) {
      // if no workspace is open, we do not need to start our servers
      return;
   }

   client = launchLanguageClient(context, workspacePath);
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
   return client?.stop();
}

function launchLanguageClient(context: vscode.ExtensionContext, workspacePath: string): LanguageClient {
   const serverOptions: ServerOptions = createServerOptions(context, workspacePath);
   const clientOptions: LanguageClientOptions = createClientOptions(context);

   // Start the client. This will also launch the server
   const languageClient = new LanguageClient('cross-model', 'CrossModel', serverOptions, clientOptions);
   languageClient.start();
   return languageClient;
}

function createServerOptions(context: vscode.ExtensionContext, workspacePath: string): ServerOptions {
   // needs to match the configuration in tsconfig.json and webpack.config.js
   const serverModule = context.asAbsolutePath(path.join('out', 'server-main'));
   const environment = { ...process.env, WORKSPACE_PATH: workspacePath };

   // The debug options for the server
   // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
   // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
   const debugOptions: ForkOptions = {
      execArgv: ['--nolazy', `--inspect${process.env.DEBUG_BREAK ? '-brk' : ''}=${process.env.DEBUG_SOCKET || '6009'}`],
      env: environment
   };

   const runOptions: ForkOptions = { env: environment };

   // If the extension is launched in debug mode then the debug server options are used
   // Otherwise the run options are used
   return {
      run: { module: serverModule, transport: TransportKind.ipc, args: process.argv, options: runOptions },
      debug: { module: serverModule, transport: TransportKind.ipc, args: process.argv, options: debugOptions }
   };
}

function createClientOptions(context: vscode.ExtensionContext): LanguageClientOptions {
   const crossModelWatcher = vscode.workspace.createFileSystemWatcher('**/*.cm');
   context.subscriptions.push(crossModelWatcher);

   // watch changes to package.json as it contains the dependencies between our systems
   const packageWatcher = vscode.workspace.createFileSystemWatcher('**/package.json');
   context.subscriptions.push(packageWatcher);

   // we listen to directories separately as when we import a library, e.g., a directory within node_modules,
   // we only get that notification but not for nested files
   const directoryWatcher = vscode.workspace.createFileSystemWatcher('**/*/');
   context.subscriptions.push(directoryWatcher);

   // Options to control the language client
   return {
      documentSelector: [
         { scheme: 'file', language: 'cross-model' },
         { scheme: 'file', pattern: '**/package.json' }
      ],
      synchronize: {
         // Notify the server about file changes to files contained in the workspace
         fileEvents: [crossModelWatcher, packageWatcher, directoryWatcher]
      }
   };
}
