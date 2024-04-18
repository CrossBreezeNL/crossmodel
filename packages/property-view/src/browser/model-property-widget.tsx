/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ApplicationShell, ShouldSaveDialog } from '@theia/core/lib/browser';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';
import { PropertyViewContentWidget } from '@theia/property-view/lib/browser/property-view-content-widget';

import { CrossModelWidget } from '@crossbreeze/core/lib/browser';
import { ResolvedElement } from '@crossbreeze/protocol';
import { GLSPDiagramWidget, GlspSelection, getDiagramWidget } from '@eclipse-glsp/theia-integration';
import { inject, injectable } from '@theia/core/shared/inversify';

@injectable()
export class ModelPropertyWidget extends CrossModelWidget implements PropertyViewContentWidget {
   @inject(ApplicationShell) protected shell: ApplicationShell;

   constructor() {
      super();
      this.node.tabIndex = 0;
      this.node.style.height = '100%';
   }

   async updatePropertyViewContent(propertyDataService?: PropertyDataService, selection?: GlspSelection | undefined): Promise<void> {
      const activeWidget = getDiagramWidget(this.shell);
      if (activeWidget?.options.uri === this.model?.uri.toString() && this.model?.uri.toString() !== selection?.sourceUri) {
         // only react to selection of active widget
         return;
      }
      if (propertyDataService) {
         const selectionData = (await propertyDataService.providePropertyData(selection)) as ResolvedElement | undefined;
         if (this.model?.uri.toString() === selectionData?.uri) {
            return;
         }
         this.setModel(selectionData?.uri);
      } else {
         this.setModel();
      }
   }

   protected override async closeModel(uri: string): Promise<void> {
      if (this.model && this.dirty) {
         const toSave = this.model;
         this.model = undefined;
         const shouldSave = await new ShouldSaveDialog(this).open();
         if (shouldSave) {
            await this.saveModel(toSave);
         }
      }
      super.closeModel(uri);
   }

   protected getDiagramWidget(): GLSPDiagramWidget | undefined {
      for (const widget of this.shell.widgets) {
         if (widget instanceof GLSPDiagramWidget) {
            return widget;
         }
      }
      return undefined;
   }

   protected override focusInput(): void {
      // do nothing, we properties are based on selection so we do not want to steal focus
   }
}
