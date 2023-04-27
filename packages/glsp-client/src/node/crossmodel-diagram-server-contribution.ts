/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { GLSPSocketServerContribution, GLSPSocketServerContributionOptions } from '@eclipse-glsp/theia-integration/lib/node';
import { injectable } from '@theia/core/shared/inversify/index';
import { CrossModelDiagramLanguage } from '../common/crossmodel-diagram-language';

export const DEFAULT_PORT = 5007;

/**
 * This contribution will be started with the backend and is responsible for forwarding the Theia frontend-backend connection
 * to a socket server on the specified port. There is no need to launch the server ourselves as it will be launched by an extension.
 */
@injectable()
export class CrossModelDiagramServerContribution extends GLSPSocketServerContribution {
   readonly id = CrossModelDiagramLanguage.contributionId;

   createContributionOptions(): Partial<GLSPSocketServerContributionOptions> {
      return {
         socketConnectionOptions: { port: DEFAULT_PORT },
         launchedExternally: true // server is started by VS Code extension
      };
   }
}
