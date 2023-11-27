/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { waitForTemporaryFileContent } from '@crossbreeze/core/lib/node';
import { GLSP_PORT_FILE, PORT_FOLDER } from '@crossbreeze/protocol';
import { GLSPSocketServerContribution, GLSPSocketServerContributionOptions } from '@eclipse-glsp/theia-integration/lib/node';
import { Channel, Disposable, URI } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { WorkspaceServer } from '@theia/workspace/lib/common';
import { CrossModelDiagramLanguage } from '../common/crossmodel-diagram-language';

/**
 * This contribution will be started with the backend and is responsible for forwarding the Theia frontend-backend connection
 * to a socket server on the specified port. There is no need to launch the server ourselves as it will be launched by an extension.
 */
@injectable()
export class CrossModelDiagramServerContribution extends GLSPSocketServerContribution {
   readonly id = CrossModelDiagramLanguage.contributionId;

   @inject(WorkspaceServer) protected workspaceServer: WorkspaceServer;

   protected port: number;

   override async doConnect(clientChannel: Channel): Promise<Disposable> {
      // the automatically assigned port is written by the server to a specific file location
      // we wait for that file to be available and read the port number out of it
      // that way we can ensure that the server is ready to accept our connection
      const workspace = await this.workspaceServer.getMostRecentlyUsedWorkspace();
      const portFile = new URI(workspace).path.join(PORT_FOLDER, GLSP_PORT_FILE).fsPath();
      const port = await waitForTemporaryFileContent(portFile);
      console.debug('Found GLSP port number in workspace: %d', port);
      if (workspace) {
         this.options.socketConnectionOptions.port = Number.parseInt(port, 10);
      }
      return super.doConnect(clientChannel);
   }

   createContributionOptions(): Partial<GLSPSocketServerContributionOptions> {
      return {
         launchedExternally: true
      };
   }
}
