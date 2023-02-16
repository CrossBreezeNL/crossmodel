/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { GLSPSocketServerContribution, GLSPSocketServerContributionOptions } from '@eclipse-glsp/theia-integration/lib/node';
import { injectable } from '@theia/core/shared/inversify/index';
import { CrossModelDiagramLanguage } from '../common/crossmodel-diagram-language';

export const DEFAULT_PORT = 5007;

@injectable()
export class CrossModelDiagramServerContribution extends GLSPSocketServerContribution {
   readonly id = CrossModelDiagramLanguage.contributionId;

   createContributionOptions(): Partial<GLSPSocketServerContributionOptions> {
      return {
         socketConnectionOptions: { port: DEFAULT_PORT },
         launchedExternally: true
      };
   }
}
