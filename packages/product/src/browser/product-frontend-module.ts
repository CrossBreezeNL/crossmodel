/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { ApplicationShell, ApplicationShellOptions, FrontendApplication } from '@theia/core/lib/browser';
import { ContainerModule } from '@theia/core/shared/inversify';
import { ThemeServiceWithDB } from '@theia/monaco/lib/browser/monaco-indexed-db';
import { CrossModelFrontendApplication } from './cross-model-frontend-application';
import { CrossModelThemeService } from './cross-model-theme-service';

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
   bind(CrossModelThemeService).toSelf().inSingletonScope();
   rebind(ThemeServiceWithDB).toService(CrossModelThemeService);

   rebind(FrontendApplication).to(CrossModelFrontendApplication).inSingletonScope();
   rebind(ApplicationShellOptions).toConstantValue(<ApplicationShell.Options>{
      bottomPanel: {
         initialSizeRatio: 0.25 // default: 0.382
      }
   });
});
