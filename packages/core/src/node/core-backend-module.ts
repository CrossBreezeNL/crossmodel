/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables/env-variables-protocol';
import { ContainerModule } from '@theia/core/shared/inversify';
import { CMEnvVariableServer } from './cm-env-variable-server';

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
    bind(CMEnvVariableServer).toSelf().inSingletonScope();
    rebind(EnvVariablesServer).toService(CMEnvVariableServer);
});
