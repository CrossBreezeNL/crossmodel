/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { MenuContribution } from '@theia/core';
import { ContainerModule } from '@theia/core/shared/inversify';
import { FileNavigatorWidget } from '@theia/navigator/lib/browser';
import { FileNavigatorContribution } from '@theia/navigator/lib/browser/navigator-contribution';
import { WorkspaceCommandContribution } from '@theia/workspace/lib/browser/workspace-commands';
import '../../style/index.css';
import { createCrossModelFileNavigatorWidget } from './cm-file-navigator-tree-widget';
import { CrossModelFileNavigatorContribution, CrossModelWorkspaceContribution } from './new-element-contribution';

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
   bind(CrossModelWorkspaceContribution).toSelf().inSingletonScope();
   rebind(WorkspaceCommandContribution).toService(CrossModelWorkspaceContribution);
   bind(MenuContribution).toService(CrossModelWorkspaceContribution);

   bind(CrossModelFileNavigatorContribution).toSelf().inSingletonScope();
   rebind(FileNavigatorContribution).toService(CrossModelFileNavigatorContribution);

   rebind(FileNavigatorWidget).toDynamicValue(ctx => createCrossModelFileNavigatorWidget(ctx.container));
});
