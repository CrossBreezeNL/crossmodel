/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { Message, OpenerService, ReactWidget, open } from '@theia/core/lib/browser';
import { URI } from '@theia/core/lib/common';
import * as React from '@theia/core/shared/react';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';
import { PropertyViewContentWidget } from '@theia/property-view/lib/browser/property-view-content-widget';

import { ModelService } from '@crossbreeze/model-service/lib/common';
import { CrossModelRoot, ResolvedElement } from '@crossbreeze/protocol';
import { EntityForm, ErrorView, RelationshipForm, withModelProvider, withTheme } from '@crossbreeze/react-model-ui';
import { GLSPDiagramWidget, GlspSelection, getDiagramWidget } from '@eclipse-glsp/theia-integration';
import { ApplicationShell } from '@theia/core/lib/browser/shell/application-shell';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { PROPERTY_CLIENT_ID } from './model-data-service';

@injectable()
export class ModelPropertyWidget extends ReactWidget implements PropertyViewContentWidget {
   static readonly ID = 'attribute-property-view';
   static readonly LABEL = 'Model property widget';

   @inject(ModelService) protected modelService: ModelService;
   @inject(ApplicationShell) protected shell: ApplicationShell;
   @inject(OpenerService) protected readonly openerService: OpenerService;
   @inject(ThemeService) protected readonly themeService: ThemeService;

   protected model?: CrossModelRoot;
   protected uri?: string;

   constructor() {
      super();
      this.id = ModelPropertyWidget.ID;
      this.title.label = ModelPropertyWidget.LABEL;
      this.title.caption = ModelPropertyWidget.LABEL;
      this.title.closable = false;
      this.node.tabIndex = 0;
      this.node.style.height = '100%';

      this.saveModel = this.saveModel.bind(this);
      this.updateModel = this.updateModel.bind(this);
      this.openModel = this.openModel.bind(this);
   }

   @postConstruct()
   init(): void {
      this.toDispose.pushAll([this.themeService.onDidColorThemeChange(() => this.update())]);
   }

   async updatePropertyViewContent(propertyDataService?: PropertyDataService, selection?: GlspSelection | undefined): Promise<void> {
      const activeWidget = getDiagramWidget(this.shell);
      if (activeWidget?.options.uri === this.uri && this.uri !== selection?.sourceUri) {
         // only react to selection of active widget
         return;
      }
      this.model = undefined;

      if (propertyDataService) {
         try {
            const selectionData = (await propertyDataService.providePropertyData(selection)) as ResolvedElement | undefined;
            this.model = selectionData?.model;
            this.uri = selectionData?.uri;
         } catch (error) {
            this.model = undefined;
         }
      }

      this.update();
   }

   async openModel(): Promise<void> {
      if (this.uri === undefined) {
         throw new Error('Cannot save undefined model');
      }
      open(this.openerService, new URI(this.uri));
   }

   async saveModel(): Promise<void> {
      if (this.model === undefined || this.uri === undefined) {
         throw new Error('Cannot save undefined model');
      }
      this.modelService.update({ uri: this.uri, model: this.model, clientId: PROPERTY_CLIENT_ID });
   }

   protected async updateModel(model: CrossModelRoot): Promise<void> {
      this.model = model;
   }

   protected render(): React.ReactNode {
      if (this.model?.entity) {
         const EntityComponent = withTheme(
            withModelProvider(EntityForm, {
               model: this.model,
               onModelUpdate: this.updateModel,
               onModelSave: this.saveModel,
               onModelOpen: this.openModel,
               modelQueryApi: this.modelService
            }),
            { theme: this.themeService.getCurrentTheme().type }
         );
         return <EntityComponent />;
      }
      if (this.model?.relationship) {
         const RelationshipComponent = withTheme(
            withModelProvider(RelationshipForm, {
               model: this.model,
               onModelUpdate: this.updateModel,
               onModelSave: this.saveModel,
               onModelOpen: this.openModel,
               modelQueryApi: this.modelService
            }),
            { theme: this.themeService.getCurrentTheme().type }
         );
         return <RelationshipComponent />;
      }
      return <ErrorView errorMessage='This is not a valid model!' />;
   }

   protected override onActivateRequest(msg: Message): void {
      super.onActivateRequest(msg);
      this.node.focus();
   }

   protected getDiagramWidget(): GLSPDiagramWidget | undefined {
      for (const widget of this.shell.widgets) {
         if (widget instanceof GLSPDiagramWidget) {
            return widget;
         }
      }
      return undefined;
   }
}
