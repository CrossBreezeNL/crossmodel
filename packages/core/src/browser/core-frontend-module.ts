/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import '../../style/index.css';
import { DynamicPortCleanup } from './dynamic-port-cleanup';

export default new ContainerModule(bind => {
   bind(FrontendApplicationContribution).to(DynamicPortCleanup);
});
