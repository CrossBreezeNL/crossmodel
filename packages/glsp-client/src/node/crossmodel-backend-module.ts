/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { GLSPServerContribution } from '@eclipse-glsp/theia-integration/lib/node/glsp-server-contribution';
import { ContainerModule } from '@theia/core/shared/inversify/index';
import { CrossModelDiagramServerContribution } from './crossmodel-diagram-server-contribution';

export default new ContainerModule(bind => {
   bind(CrossModelDiagramServerContribution).toSelf().inSingletonScope();
   bind(GLSPServerContribution).toService(CrossModelDiagramServerContribution);
});
