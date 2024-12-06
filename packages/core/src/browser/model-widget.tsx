/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ModelService, ModelServiceClient } from '@crossbreeze/model-service/lib/common';
import { CrossModelDocument, CrossModelRoot, ModelDiagnostic, ModelUpdatedEvent, RenderProps } from '@crossbreeze/protocol';
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

   protected document?: CrossModelDocument;
   protected error: string | undefined;

   @postConstruct()
   init(): void {
      this.id = this.options.widgetId;
      this.title.closable = true;

      this.setModel(this.options.uri);

      this.autoSave = this.editorPreferences.get('files.autoSave');
      this.autoSaveDelay = this.editorPreferences.get('files.autoSaveDelay');

      this.toDispose.pushAll([
         this.serviceClient.onModelUpdate(event => {
            if (event.sourceClientId !== this.options.clientId && event.document.uri === this.document?.uri) {
               this.handleExternalUpdate(event);
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
      if (this.document?.uri) {
         await this.closeModel(this.document.uri.toString());
      }
      this.document = uri ? await this.openModel(uri) : undefined;
      this.setDirty(false);
      this.update();
      this.focusInput();
   }

   protected async closeModel(uri: string): Promise<void> {
      this.document = undefined;
      await this.modelService.close({ clientId: this.options.clientId, uri });
   }

   protected async openModel(uri: string): Promise<CrossModelDocument | undefined> {
      try {
         const document = await this.modelService.open({ clientId: this.options.clientId, uri });
         return document;
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

   protected async handleExternalUpdate({ document, reason, sourceClientId }: ModelUpdatedEvent): Promise<void> {
      if (this.document && !deepEqual(this.document.root, document.root)) {
         console.debug(`[${this.options.clientId}] Receive update from ${sourceClientId} due to '${reason}'`);
         this.document = document;
         this.update();
      }
   }

   protected async updateModel(root: CrossModelRoot): Promise<void> {
      if (this.document && !deepEqual(this.document.root, root)) {
         this.document.root = root;
         this.setDirty(true);
         console.debug(`[${this.options.clientId}] Send update to server`);
         await this.modelService.update({ uri: this.document.uri, model: root, clientId: this.options.clientId });
         if (this.autoSave !== 'off' && this.dirty) {
            const saveTimeout = setTimeout(() => {
               this.save();
               clearTimeout(saveTimeout);
            }, this.autoSaveDelay);
         }
      }
   }

   protected async saveModel(doc = this.document): Promise<void> {
      if (doc === undefined) {
         throw new Error('Cannot save undefined model');
      }
      if (ModelDiagnostic.hasErrors(doc.diagnostics)) {
         // we do not support saving erroneous models in model widgets as we cannot deal with them properly, fixes are done via code editor
         console.debug(`[${this.options.clientId}] Abort Save as we have an erroneous model`);
         return;
      }
      console.debug(`[${this.options.clientId}] Save model`);
      this.setDirty(false);
      await this.modelService.save({ uri: doc.uri.toString(), model: doc.root, clientId: this.options.clientId });
   }

   protected async openModelInEditor(): Promise<void> {
      if (this.document?.uri === undefined) {
         throw new Error('Cannot open undefined model');
      }
      open(this.openerService, new URI(this.document.uri));
   }

   protected getModelProviderProps(): ModelProviderProps {
      return {
         document: this.document!,
         dirty: this.dirty,
         onModelUpdate: this.handleUpdateRequest,
         onModelSave: this.handleSaveRequest,
         onModelOpen: this.handleOpenRequest,
         modelQueryApi: this.modelService
      };
   }

   protected handleUpdateRequest = debounce(async (root: CrossModelRoot): Promise<void> => {
      await this.updateModel(root);
   }, 200);

   protected handleSaveRequest?: SaveCallback = () => this.save();

   protected handleOpenRequest?: OpenCallback = () => this.openModelInEditor();

   override close(): void {
      if (this.document) {
         this.closeModel(this.document.uri.toString());
      }
      super.close();
   }

   render(): React.ReactNode {
      if (this.document?.root?.entity) {
         return <EntityComponent {...this.getModelProviderProps()} {...this.getRenderProperties()} />;
      }
      if (this.document?.root?.relationship) {
         return <RelationshipComponent {...this.getModelProviderProps()} {...this.getRenderProperties()} />;
      }
      if (this.document?.root?.mapping) {
         const renderProps = this.getRenderProperties() as RenderProps & MappingRenderProps & SourceObjectRenderProps;
         if (renderProps?.mappingIndex >= 0) {
            return <MappingComponent {...this.getModelProviderProps()} {...renderProps} />;
         }
         if (renderProps?.sourceObjectIndex >= 0) {
            return <SourceObjectComponent {...this.getModelProviderProps()} {...renderProps} />;
         }
      }
      if (this.error) {
         return <ErrorView errorMessage={this.error} />;
      }
      return <div className='theia-widget-noInfo'>No properties available.</div>;
   }

   protected getRenderProperties(): RenderProps {
      return {
         theme: this.themeService.getCurrentTheme().type
      };
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
