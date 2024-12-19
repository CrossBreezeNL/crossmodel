/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { ApplicationShell, ApplicationShellOptions, FrontendApplication } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { CrossModelFrontendApplication } from './cross-model-frontend-application';

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
   rebind(FrontendApplication).to(CrossModelFrontendApplication).inSingletonScope();
   rebind(ApplicationShellOptions).toConstantValue(<ApplicationShell.Options>{
      bottomPanel: {
         initialSizeRatio: 0.25 // default: 0.382
      }
   });
});
