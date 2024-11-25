/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { ContextMenuIntegration, Integration, IntegrationArgs, TheiaIntegrationOptions } from '@eclipse-glsp/glsp-playwright';
import { Locator, Page } from '@playwright/test';
import { TheiaAppFactory, TheiaAppLoader } from '@theia/playwright';
import { CMApp } from './cm-app';
import { CMWorkspace } from './cm-workspace';

export class CMTheiaIntegration extends Integration implements ContextMenuIntegration {
   protected theiaApp: CMApp;

   override get page(): Page {
      return this.theiaApp.page;
   }

   get app(): CMApp {
      return this.theiaApp;
   }

   get contextMenuLocator(): Locator {
      return this.page.locator('body > .p-Widget.p-Menu');
   }

   constructor(
      args: IntegrationArgs,
      protected readonly options: TheiaIntegrationOptions
   ) {
      super(args, 'Theia');
   }

   protected override async launch(): Promise<void> {
      const ws = new CMWorkspace(this.options.workspace ? [this.options.workspace] : undefined);
      this.theiaApp = await TheiaAppLoader.load(this.args, ws, CMApp as TheiaAppFactory<CMApp>);
      this.theiaApp.integration = this;
      this.theiaApp.initialize(this.options);
   }
}
