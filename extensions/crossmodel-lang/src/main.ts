/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import 'reflect-metadata';

import { startLanguageServer } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { createConnection, ProposedFeatures } from 'vscode-languageserver/node';
import { startGLSPServer } from './glsp-server/launch';
import { createCrossModelServices } from './language-server/cross-model-module';
import { startJsonServer } from './model-server/launch';

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the shared services and language-specific services
const { shared, CrossModel } = createCrossModelServices({ connection, ...NodeFileSystem });

// Start the language server with the shared services
startLanguageServer(shared);

shared.workspace.WorkspaceManager.onWorkspaceInitialized(() => {
   // Start the graphical language server with the shared services
   startGLSPServer({ shared, language: CrossModel });
   // Start the JSON server with the shared services
   startJsonServer({ shared, language: CrossModel });
});
