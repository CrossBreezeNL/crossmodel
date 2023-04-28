/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CommandService, Emitter, Event } from '@theia/core';
import { LabelProvider, NavigatableWidget, NavigatableWidgetOptions, ReactWidget, SaveOptions, Saveable } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { CrossModelRoot, Entity, FormEditorService, Relationship } from '../common/form-client-protocol';
import { FormEditorClientImpl } from './form-client';

export const FormEditorWidgetOptions = Symbol('FormEditorWidgetOptions');
export interface FormEditorWidgetOptions extends NavigatableWidgetOptions {
   id: string;
}

@injectable()
export class FormEditorWidget extends ReactWidget implements NavigatableWidget, Saveable {
   dirty = false;
   autoSave: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange';
   public readonly onDirtyChangedEmitter = new Emitter<void>();
   onDirtyChanged: Event<void> = this.onDirtyChangedEmitter.event;

   @inject(FormEditorWidgetOptions) protected options: FormEditorWidgetOptions;
   @inject(LabelProvider) protected labelProvider: LabelProvider;
   @inject(FormEditorService) private readonly formEditorService: FormEditorService;
   @inject(CommandService) protected commandService: CommandService;
   @inject(FormEditorClientImpl) protected formClient: FormEditorClientImpl;

   protected model: CrossModelRoot | undefined = undefined;
   protected error: string | undefined = undefined;

   @postConstruct()
   init(): void {
      this.id = this.options.id;
      this.title.label = this.labelProvider.getName(this.getResourceUri());
      this.title.iconClass = this.labelProvider.getIcon(this.getResourceUri());
      this.title.closable = true;
      this.loadModel();
      this.formClient.onUpdate(document => {
         if (document.uri === this.getResourceUri().toString()) {
            this.model = document.model;
            this.update();
         }
      });
   }

   protected async loadModel(): Promise<void> {
      try {
         const uri = this.getResourceUri().toString();
         await this.formEditorService.open(uri);
         const model = await this.formEditorService.request(uri);
         if (model) {
            this.model = model;
         }
      } catch (error: any) {
         this.error = error;
      } finally {
         this.update();
      }
   }

   override close(): void {
      this.formEditorService.close(this.getResourceUri().toString());
      super.close();
   }

   render(): React.ReactNode {
      if (!this.model && this.error === undefined) {
         return <div className='form-editor loading'></div>;
      }
      if (!this.model && this.error !== undefined) {
         return (
            <div className='form-editor error'>
               <p>{this.error}</p>
            </div>
         );
      }

      if (this.model?.entity) {
         return this.renderEntity(this.model.entity);
      } else if (this.model?.relationship) {
         return this.renderRelationship(this.model.relationship);
      } else {
         return (
            <div className='form-editor error'>
               <p>Unknown model element</p>
            </div>
         );
      }
   }

   renderRelationship(relationship: Relationship): React.ReactNode {
      return (
         <div className='form-editor'>
            <div className='header'>
               <h1>
                  <span className='label'>Relationship&nbsp;</span>
                  <span className='value'>{relationship.name}</span>
               </h1>
            </div>
            <div>
               Source:
               <input
                  className='theia-input'
                  value={relationship.source}
                  onChange={e => {
                     relationship.source = e.target.value;
                     this.updateModel(e);
                  }}
               />
            </div>
            <div>
               Target:
               <input
                  className='theia-input'
                  value={relationship.target}
                  onChange={e => {
                     relationship.target = e.target.value;
                     this.updateModel(e);
                  }}
               />
            </div>
         </div>
      );
   }

   renderEntity(entity: Entity): React.ReactNode {
      return (
         <div className='form-editor'>
            <div className='header'>
               <h1>
                  <span className='label'>Entity&nbsp;</span>
                  <span className='value'>{entity.name}</span>
               </h1>
            </div>
            <div>
               Description:
               <input
                  className='theia-input'
                  value={entity.description}
                  onChange={e => {
                     entity.description = e.target.value;
                     this.updateModel(e);
                  }}
               />
            </div>
         </div>
      );
   }

   getResourceUri(): URI {
      return new URI(this.options.uri);
   }

   createMoveToUri(resourceUri: URI): URI | undefined {
      return undefined;
   }

   protected async updateModel(event: React.ChangeEvent<HTMLInputElement>): Promise<void> {
      this.setDirty(true);
      this.update();
      await this.formEditorService.update(this.getResourceUri().toString(), this.model!);
   }

   async save(options?: SaveOptions | undefined): Promise<void> {
      if (this.model === undefined) {
         throw new Error('Cannot save undefined model');
      }
      await this.formEditorService.save(this.getResourceUri().toString(), this.model);
      this.setDirty(false);
   }

   setDirty(dirty: boolean): void {
      if (dirty === this.dirty) {
         return;
      }
      this.dirty = dirty;
      this.onDirtyChangedEmitter.fire();
   }
}
