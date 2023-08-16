/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { waitForTemporaryFileContent } from '@crossbreeze/core/lib/node';
import { GLSP_PORT_FILE } from '@crossbreeze/protocol';
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
      const workspace = await this.workspaceServer.getMostRecentlyUsedWorkspace();
      const portFile = new URI(workspace).path.join(GLSP_PORT_FILE).fsPath();
      const port = await waitForTemporaryFileContent(portFile);
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
