/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { GLSPServerContribution } from '@eclipse-glsp/theia-integration/lib/node/glsp-server-contribution';
import { ContainerModule } from '@theia/core/shared/inversify/index';
import { CrossModelDiagramServerContribution } from './crossmodel-diagram-server-contribution';
import { bindAsService } from '@eclipse-glsp/protocol';

export default new ContainerModule(bind => {
   bindAsService(bind, GLSPServerContribution, CrossModelDiagramServerContribution);
});
