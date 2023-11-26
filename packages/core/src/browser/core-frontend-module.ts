/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { MenuContribution } from '@theia/core';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { FileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';
import { WorkspaceCommandContribution } from '@theia/workspace/lib/browser/workspace-commands';
import '../../style/index.css';
import { DynamicPortCleanup } from './dynamic-port-cleanup';
import { CrossModelFileNavigatorContribution, CrossModelWorkspaceContribution } from './new-element-contribution';

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
   bind(FrontendApplicationContribution).to(DynamicPortCleanup);

   bind(CrossModelWorkspaceContribution).toSelf().inSingletonScope();
   rebind(WorkspaceCommandContribution).toService(CrossModelWorkspaceContribution);
   bind(MenuContribution).toService(CrossModelWorkspaceContribution);

   bind(CrossModelFileNavigatorContribution).toSelf().inSingletonScope();
   rebind(FileNavigatorContribution).toService(CrossModelFileNavigatorContribution);
});
