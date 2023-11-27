/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { bindAsService } from '@eclipse-glsp/protocol';
import { GLSPServerContribution } from '@eclipse-glsp/theia-integration/lib/node/glsp-server-contribution';
import { ContainerModule } from '@theia/core/shared/inversify/index';
import { CrossModelDiagramServerContribution } from './crossmodel-diagram-server-contribution';

export default new ContainerModule(bind => {
   bindAsService(bind, GLSPServerContribution, CrossModelDiagramServerContribution);
});
