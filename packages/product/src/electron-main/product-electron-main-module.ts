/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ElectronMainApplicationContribution } from '@theia/core/lib/electron-main/electron-main-application';
import { ContainerModule } from '@theia/core/shared/inversify';
import { IconContribution } from './icon-contribution';

export default new ContainerModule(bind => {
   bind(IconContribution).toSelf().inSingletonScope();
   bind(ElectronMainApplicationContribution).toService(IconContribution);
});
