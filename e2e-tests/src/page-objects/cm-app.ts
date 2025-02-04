/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { IntegrationArgs, TheiaGLSPApp } from '@eclipse-glsp/glsp-playwright';
import { Page } from '@playwright/test';
import { TheiaEditor, TheiaNotificationIndicator, TheiaNotificationOverlay, TheiaWorkspace } from '@theia/playwright';
import { CMCompositeEditor, IntegratedEditorType } from './cm-composite-editor';
import { CMExplorerView } from './cm-explorer-view';
import { CMTheiaIntegration } from './cm-theia-integration';
import path = require('path');

export interface CMAppArgs extends Omit<IntegrationArgs, 'page'> {
   workspaceUrl?: string;
   baseUrl?: string;
}
export class CMApp extends TheiaGLSPApp {
   public static async load(args: CMAppArgs): Promise<CMApp> {
      const integration = new CMTheiaIntegration(
         { browser: args.browser, page: {} as any, playwright: args.playwright },
         {
            type: 'Theia',
            workspace: args.workspaceUrl ?? path.join(__dirname, '../resources/sample-workspace'),
            widgetId: '',
            url: args.baseUrl ?? 'http://localhost:3000'
         }
      );
      await integration.initialize();
      await integration.start();
      await integration.app.notificationOverlay.waitForEntry('Connected to Model Server on port');
      await integration.app.notificationOverlay.waitForEntry('Connected to Graphical Server on port');
      await integration.app.notificationOverlay.clearAllNotifications();

      return integration.app;
   }

   readonly notificationIndicator: TheiaNotificationIndicator;
   readonly notificationOverlay: TheiaNotificationOverlay;

   public constructor(page: Page, workspace: TheiaWorkspace, isElectron: boolean) {
      super(page, workspace, isElectron);
      this.notificationIndicator = this.notificationIndicator = new TheiaNotificationIndicator(this);
      this.notificationOverlay = this.notificationOverlay = new TheiaNotificationOverlay(this, this.notificationIndicator);
   }

   protected _integration: CMTheiaIntegration;

   set integration(integration: CMTheiaIntegration) {
      if (!this._integration) {
         this._integration = integration;
      } else {
         console.warn('Integration already set');
      }
   }

   get integration(): CMTheiaIntegration {
      return this._integration;
   }

   async openExplorerView(): Promise<CMExplorerView> {
      const explorer = await this.openView(CMExplorerView);
      await explorer.waitForVisibleFileNodes();
      return explorer;
   }

   async openCompositeEditor<T extends keyof IntegratedEditorType>(filePath: string, editorType: T): Promise<IntegratedEditorType[T]> {
      const editor = await this.openEditor(filePath, CMCompositeEditor);
      await editor.waitForVisible();
      let integratedEditor: TheiaEditor | undefined = undefined;
      if (editorType === 'Code Editor') {
         integratedEditor = await editor.switchToCodeEditor();
      } else if (editorType === 'Form Editor') {
         integratedEditor = await editor.switchToFormEditor();
      } else if (editorType === 'System Diagram') {
         integratedEditor = await editor.switchToSystemDiagram();
      } else if (editorType === 'Mapping Diagram') {
         integratedEditor = await editor.switchToMappingDiagram();
      }
      if (integratedEditor === undefined) {
         throw new Error(`Unknown editor type: ${editorType}`);
      }
      return integratedEditor as IntegratedEditorType[T];
   }

   override openEditor<T extends TheiaEditor>(
      filePath: string,
      editorFactory: new (editorFilePath: string, app: CMApp) => T,
      editorName?: string | undefined,
      expectFileNodes?: boolean | undefined
   ): Promise<T> {
      return super.openEditor(filePath, editorFactory as new (f: string, a: TheiaGLSPApp) => T, editorName, expectFileNodes);
   }
}
