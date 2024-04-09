/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ModelService, ModelServiceClient } from '@crossbreeze/model-service/lib/common';
import { CrossModelRoot } from '@crossbreeze/protocol';
import { EntityForm, ErrorView, RelationshipForm, withModelProvider, withTheme } from '@crossbreeze/react-model-ui';
import { CommandService, Emitter, Event } from '@theia/core';
import {
   LabelProvider,
   Message,
   NavigatableWidget,
   NavigatableWidgetOptions,
   ReactWidget,
   SaveOptions,
   Saveable
} from '@theia/core/lib/browser';
import { ThemeService } from '@theia/core/lib/browser/theming';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { EditorPreferences } from '@theia/editor/lib/browser';
import * as deepEqual from 'fast-deep-equal';
import * as debounce from 'p-debounce';

export const FormEditorWidgetOptions = Symbol('FormEditorWidgetOptions');
export interface FormEditorWidgetOptions extends NavigatableWidgetOptions {
   id: string;
}

const FORM_CLIENT_ID = 'form-client';

@injectable()
export class FormEditorWidget extends ReactWidget implements NavigatableWidget, Saveable {
   @inject(FormEditorWidgetOptions) protected options: FormEditorWidgetOptions;
   @inject(LabelProvider) protected labelProvider: LabelProvider;
   @inject(ModelService) private readonly modelService: ModelService;
   @inject(CommandService) protected commandService: CommandService;
   @inject(ModelServiceClient) protected formClient: ModelServiceClient;
   @inject(ThemeService) protected readonly themeService: ThemeService;
   @inject(EditorPreferences) private readonly editorPreferences: EditorPreferences;

   protected readonly onDirtyChangedEmitter = new Emitter<void>();
   onDirtyChanged: Event<void> = this.onDirtyChangedEmitter.event;
   dirty = false;
   autoSave: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange';
   autoSaveDelay: number;

   protected syncedModel: CrossModelRoot | undefined;
   protected error: string | undefined;

   @postConstruct()
   init(): void {
      this.id = this.options.id;
      this.title.label = this.labelProvider.getName(this.getResourceUri());
      this.title.iconClass = this.labelProvider.getIcon(this.getResourceUri());
      this.title.closable = true;

      this.updateModel = this.updateModel.bind(this);
      this.getResourceUri = this.getResourceUri.bind(this);
      this.loadModel();

      this.autoSave = this.editorPreferences.get('files.autoSave');
      this.autoSaveDelay = this.editorPreferences.get('files.autoSaveDelay');

      this.toDispose.pushAll([
         this.formClient.onUpdate(event => {
            if (event.sourceClientId !== FORM_CLIENT_ID && event.uri === this.getResourceUri().toString()) {
               this.modelUpdated(event.model);
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

   protected async loadModel(): Promise<void> {
      try {
         const uri = this.getResourceUri().toString();
         const model = await this.modelService.open({ uri, clientId: FORM_CLIENT_ID });
         if (model) {
            this.syncedModel = model;
         }
      } catch (error: any) {
         this.error = error;
      } finally {
         this.update();
      }
   }

   async save(options?: SaveOptions | undefined): Promise<void> {
      if (this.syncedModel === undefined) {
         throw new Error('Cannot save undefined model');
      }

      this.setDirty(false);
      await this.modelService.save({ uri: this.getResourceUri().toString(), model: this.syncedModel, clientId: FORM_CLIENT_ID });
   }

   protected updateModel = debounce(async (model: CrossModelRoot) => {
      if (!deepEqual(this.syncedModel, model)) {
         this.syncedModel = model;
         this.setDirty(true);
         await this.modelService.update({ uri: this.getResourceUri().toString(), model, clientId: FORM_CLIENT_ID });
         if (this.autoSave !== 'off' && this.dirty) {
            const saveTimeout = setTimeout(() => {
               this.save();
               clearTimeout(saveTimeout);
            }, this.autoSaveDelay);
         }
      }
   }, 200);

   protected modelUpdated(model: CrossModelRoot): void {
      if (!deepEqual(this.syncedModel, model)) {
         this.syncedModel = model;
         this.update();
      }
   }

   override close(): void {
      this.modelService.close({ uri: this.getResourceUri().toString(), clientId: FORM_CLIENT_ID });
      super.close();
   }

   setDirty(dirty: boolean): void {
      if (dirty === this.dirty) {
         return;
      }

      this.dirty = dirty;
      this.onDirtyChangedEmitter.fire();
   }

   render(): React.ReactNode {
      if (this.syncedModel?.entity) {
         const EntityComponent = withTheme(
            withModelProvider(EntityForm, {
               model: this.syncedModel,
               onModelUpdate: this.updateModel,
               modelQueryApi: this.modelService
            }),
            { theme: this.themeService.getCurrentTheme().type }
         );
         return <EntityComponent />;
      }
      if (this.syncedModel?.relationship) {
         const RelationshipComponent = withTheme(
            withModelProvider(RelationshipForm, {
               model: this.syncedModel,
               onModelUpdate: this.updateModel,
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
      const focusInput = (): boolean => {
         const inputs = this.node.getElementsByTagName('input');
         if (inputs.length > 0) {
            inputs[0].focus();
            return true;
         }
         return false;
      };
      if (!focusInput()) {
         setTimeout(focusInput, 500);
      }
   }

   getResourceUri(): URI {
      return new URI(this.options.uri);
   }

   createMoveToUri(resourceUri: URI): URI | undefined {
      return resourceUri;
   }
}
