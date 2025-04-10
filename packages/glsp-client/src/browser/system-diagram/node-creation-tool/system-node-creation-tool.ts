/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { ModelService } from '@crossbreezenl/model-service/lib/common';
import { RelationshipType, findNextUnique, identity } from '@crossbreezenl/protocol';
import {
   Action,
   Args,
   CreateNodeOperation,
   Disposable,
   DisposableCollection,
   GModelElement,
   GhostElement,
   IDiagramOptions,
   MessageAction,
   NodeCreationTool,
   NodeCreationToolMouseListener,
   SetUIExtensionVisibilityAction,
   TYPES,
   TrackedInsert
} from '@eclipse-glsp/client';
import { SingleTextInputDialog } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { CrossModelCommandPalette } from '../../cross-model-command-palette';

@injectable()
export class SystemNodeCreationTool extends NodeCreationTool {
   @inject(ModelService) readonly modelService: ModelService;
   @inject(TYPES.IDiagramOptions) readonly diagramOptions: IDiagramOptions;

   protected override createNodeCreationListener(ghostElement: GhostElement): Disposable {
      const toolListener = new SystemNodeCreationToolMouseListener(this.triggerAction, this, ghostElement);
      return new DisposableCollection(toolListener, this.mouseTool.registerListener(toolListener));
   }
}

export class SystemNodeCreationToolMouseListener extends NodeCreationToolMouseListener {
   protected override tool: SystemNodeCreationTool;

   protected override isContinuousMode(_ctx: GModelElement, _event: MouseEvent): boolean {
      return true;
   }

   protected override getCreateOperation(ctx: GModelElement, event: MouseEvent, insert: TrackedInsert): Action {
      if (this.triggerAction.args?.type === 'show') {
         return SetUIExtensionVisibilityAction.create({
            extensionId: CrossModelCommandPalette.ID,
            visible: true,
            contextElementsId: [this.ghostElementId]
         });
      } else if (this.triggerAction.args?.type === 'create') {
         this.queryEntityName().then(name => {
            if (name === undefined) {
               // user cancelled the dialog
               return;
            }
            const action = super.getCreateOperation(ctx, event, insert) as CreateNodeOperation & { args: Args };
            action.args.name = name;
            this.tool.dispatchActions([action]);
         });
         return MessageAction.create('', { severity: 'NONE' });
      }
      throw new Error('Invalid node creation type');
   }

   protected async queryEntityName(): Promise<string | undefined> {
      const referenceableEntities = await this.tool.modelService.findReferenceableElements({
         container: { uri: this.tool.diagramOptions.sourceUri!, type: RelationshipType },
         property: 'parent'
      });
      const existingNames = referenceableEntities.map(entity => entity.label);
      const nextUniqueName = findNextUnique('NewEntity', existingNames, identity);
      return new SingleTextInputDialog({
         title: 'Entity Name',
         placeholder: nextUniqueName,
         initialValue: nextUniqueName,
         validate: name => {
            if (name.trim().length === 0) {
               return 'Entity name cannot be empty';
            }
            if (existingNames.includes(name)) {
               return 'Entity with that name already exists';
            }
            return true;
         }
      }).open();
   }
}
