/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { BuiltinThemeProvider } from '@theia/core/lib/browser/theming';
import { injectable } from '@theia/core/shared/inversify';
import { ThemeServiceWithDB } from '@theia/monaco/lib/browser/monaco-indexed-db';

@injectable()
export class CrossModelThemeService extends ThemeServiceWithDB {
   override setCurrentTheme(themeId: string, persist?: boolean): void {
      super.setCurrentTheme(themeId, persist);
      this.removeBuiltInThemes(themeId);
   }

   protected removeBuiltInThemes(themeId: string): void {
      if (!this.tryGetTheme(BuiltinThemeProvider.themes[0].id)) {
         // the built-in themes are already removed
         return;
      }
      const configuredTheme = this.getConfiguredTheme();
      if (configuredTheme && configuredTheme.id === themeId) {
         // remove built-in themes as soon as we have the configured theme ready, which may be loaded delayed through an extension
         BuiltinThemeProvider.themes.forEach(theme => this.register(theme).dispose());
      }
   }
}
