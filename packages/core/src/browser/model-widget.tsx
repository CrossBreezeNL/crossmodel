/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ModelService, ModelServiceClient } from '@crossbreeze/model-service/lib/common';
import { CrossModelRoot, RenderProps } from '@crossbreeze/protocol';
import {
   EntityComponent,
   ErrorView,
   MappingComponent,
   MappingRenderProps,
   ModelProviderProps,
   OpenCallback,
   RelationshipComponent,
   SaveCallback,
   SourceObjectComponent,
   SourceObjectRenderProps
} from '@crossbreeze/react-model-ui';
import { Emitter, Event } from '@theia/core';
import { LabelProvider, Message, OpenerService, ReactWidget, Saveable, open } from '@theia/core/lib/browser';
import { ThemeService } from '@theia/core/lib/browser/theming';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { EditorPreferences } from '@theia/editor/lib/browser';
import * as deepEqual from 'fast-deep-equal';
import * as debounce from 'p-debounce';

export const CrossModelWidgetOptions = Symbol('FormEditorWidgetOptions');
export interface CrossModelWidgetOptions {
   clientId: string;
   widgetId: string;
   uri?: string;
}

interface Model {
   uri: URI;
   root: CrossModelRoot;
}

@injectable()
export class CrossModelWidget extends ReactWidget implements Saveable {
   @inject(CrossModelWidgetOptions) protected options: CrossModelWidgetOptions;
   @inject(LabelProvider) protected labelProvider: LabelProvider;
   @inject(ModelService) protected readonly modelService: ModelService;
   @inject(ModelServiceClient) protected serviceClient: ModelServiceClient;
   @inject(ThemeService) protected readonly themeService: ThemeService;
   @inject(EditorPreferences) protected readonly editorPreferences: EditorPreferences;
   @inject(OpenerService) protected readonly openerService: OpenerService;

   protected readonly onDirtyChangedEmitter = new Emitter<void>();
   onDirtyChanged: Event<void> = this.onDirtyChangedEmitter.event;
   dirty = false;
   autoSave: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange';
   autoSaveDelay: number;

   protected model?: Model;
   protected error: string | undefined;

   protected readonly onModelSetEmitter = new Emitter<Model | undefined>();
   onModelSet: Event<Model | undefined> = this.onModelSetEmitter.event;

   @postConstruct()
   init(): void {
      this.id = this.options.widgetId;
      this.title.closable = true;

      this.setModel(this.options.uri);

      this.autoSave = this.editorPreferences.get('files.autoSave');
      this.autoSaveDelay = this.editorPreferences.get('files.autoSaveDelay');

      this.toDispose.pushAll([
         this.serviceClient.onModelUpdate(event => {
            if (event.sourceClientId !== this.options.clientId && event.uri === this.model?.uri.toString()) {
               this.handleExternalUpdate(event.model);
            }
         }),
         this.editorPreferences.onPreferenceChanged(event => {
            if (event.preferenceName === 'files.autoSave') {
               this.autoSave = this.editorPreferences.get('files.autoSave');
            }
            if (event.preferenceName === 'files.autoSaveDelay') {
               this.autoSaveDelay = this.editorPreferences.get('files.autoSaveDelay');
            }
         }),
         this.themeService.onDidColorThemeChange(() => this.update())
      ]);
   }

   protected async setModel(uri?: string): Promise<void> {
      if (this.model?.uri) {
         await this.closeModel(this.model.uri.toString());
      }
      this.model = uri ? await this.openModel(uri) : undefined;
      this.updateTitle(this.model?.uri);
      this.setDirty(false);
      this.update();
      this.focusInput();
      this.onModelSetEmitter.fire(this.model);
   }

   private updateTitle(uri?: URI): void {
      if (uri) {
         this.title.label = this.labelProvider.getName(uri);
         this.title.iconClass = this.labelProvider.getIcon(uri);
      } else {
         this.title.label = 'Model Widget';
         this.title.iconClass = 'no-icon';
      }
   }

   protected async closeModel(uri: string): Promise<void> {
      this.model = undefined;
      await this.modelService.close({ clientId: this.options.clientId, uri });
   }

   protected async openModel(uri: string): Promise<Model | undefined> {
      try {
         const model = await this.modelService.open({ clientId: this.options.clientId, uri });
         if (model) {
            return { root: model, uri: new URI(uri) };
         }
         return undefined;
      } catch (error: any) {
         this.error = error;
         return undefined;
      }
   }

   setDirty(dirty: boolean): void {
      if (dirty === this.dirty) {
         return;
      }

      this.dirty = dirty;
      this.onDirtyChangedEmitter.fire();
      this.update();
   }

   async save(): Promise<void> {
      return this.saveModel();
   }

   protected async handleExternalUpdate(root: CrossModelRoot): Promise<void> {
      if (this.model && !deepEqual(this.model.root, root)) {
         this.model.root = root;
         this.update();
      }
   }

   protected async updateModel(root: CrossModelRoot): Promise<void> {
      if (this.model && !deepEqual(this.model.root, root)) {
         this.model.root = root;
         this.setDirty(true);
         await this.modelService.update({ uri: this.model.uri.toString(), model: root, clientId: this.options.clientId });
         if (this.autoSave !== 'off' && this.dirty) {
            const saveTimeout = setTimeout(() => {
               this.save();
               clearTimeout(saveTimeout);
            }, this.autoSaveDelay);
         }
      }
   }

   protected async saveModel(model = this.model): Promise<void> {
      if (model === undefined) {
         throw new Error('Cannot save undefined model');
      }

      this.setDirty(false);
      await this.modelService.save({ uri: model.uri.toString(), model: model.root, clientId: this.options.clientId });
   }

   protected async openModelInEditor(): Promise<void> {
      if (this.model?.uri === undefined) {
         throw new Error('Cannot open undefined model');
      }
      open(this.openerService, this.model.uri);
   }

   protected getModelProviderProps(model: CrossModelRoot): ModelProviderProps {
      return {
         model,
         dirty: this.dirty,
         onModelUpdate: this.handleUpdateRequest,
         onModelSave: this.handleSaveRequest,
         onModelOpen: this.handleOpenRequest,
         modelQueryApi: this.modelService
      };
   }

   protected handleUpdateRequest = debounce(async (root: CrossModelRoot): Promise<void> => {
      this.updateModel(root);
   }, 200);

   protected handleSaveRequest?: SaveCallback = () => this.save();

   protected handleOpenRequest?: OpenCallback = () => this.openModelInEditor();

   override close(): void {
      if (this.model) {
         this.closeModel(this.model.uri.toString());
      }
      super.close();
   }

   render(): React.ReactNode {
      if (this.model?.root?.entity) {
         return (
            <EntityComponent
               dirty={this.dirty}
               model={this.model.root}
               onModelUpdate={this.handleUpdateRequest}
               onModelSave={this.handleSaveRequest}
               onModelOpen={this.handleOpenRequest}
               modelQueryApi={this.modelService}
               theme={this.themeService.getCurrentTheme().type}
               {...this.getRenderProperties(this.model.root)}
            />
         );
      }
      if (this.model?.root?.relationship) {
         return (
            <RelationshipComponent
               dirty={this.dirty}
               model={this.model.root}
               onModelUpdate={this.handleUpdateRequest}
               onModelSave={this.handleSaveRequest}
               onModelOpen={this.handleOpenRequest}
               modelQueryApi={this.modelService}
               theme={this.themeService.getCurrentTheme().type}
               {...this.getRenderProperties(this.model.root)}
            />
         );
      }
      if (this.model?.root?.mapping) {
         const renderProps = this.getRenderProperties(this.model.root) as unknown as MappingRenderProps & SourceObjectRenderProps;
         if (renderProps?.mappingIndex >= 0) {
            return (
               <MappingComponent
                  dirty={this.dirty}
                  model={this.model.root}
                  onModelUpdate={this.handleUpdateRequest}
                  onModelSave={this.handleSaveRequest}
                  onModelOpen={this.handleOpenRequest}
                  modelQueryApi={this.modelService}
                  theme={this.themeService.getCurrentTheme().type}
                  {...renderProps}
               />
            );
         }
         if (renderProps?.sourceObjectIndex >= 0) {
            return (
               <SourceObjectComponent
                  dirty={this.dirty}
                  model={this.model.root}
                  onModelUpdate={this.handleUpdateRequest}
                  onModelSave={this.handleSaveRequest}
                  onModelOpen={this.handleOpenRequest}
                  modelQueryApi={this.modelService}
                  theme={this.themeService.getCurrentTheme().type}
                  {...renderProps}
               />
            );
         }
      }
      if (this.error) {
         return <ErrorView errorMessage={this.error} />;
      }
      return <div className='theia-widget-noInfo'>No properties available.</div>;
   }

   protected getRenderProperties(root: CrossModelRoot): RenderProps {
      return {};
   }

   protected focusInput(): void {
      setTimeout(() => {
         document.activeElement;
         const inputs = this.node.getElementsByTagName('input');
         if (inputs.length > 0) {
            inputs[0].focus();
         }
      }, 50);
   }

   protected override onActivateRequest(msg: Message): void {
      super.onActivateRequest(msg);
      this.focusInput();
   }
}
