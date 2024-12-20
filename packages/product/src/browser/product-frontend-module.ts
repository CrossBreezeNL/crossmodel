/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { ContainerModule } from '@theia/core/shared/inversify';
import { ThemeServiceWithDB } from '@theia/monaco/lib/browser/monaco-indexed-db';
import { CrossModelThemeService } from './cross-model-theme-service';

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
   bind(CrossModelThemeService).toSelf().inSingletonScope();
   rebind(ThemeServiceWithDB).toService(CrossModelThemeService);
});
