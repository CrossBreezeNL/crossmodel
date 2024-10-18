/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { toId } from '@crossbreeze/protocol';
import { ApplyLabelEditOperation, Command, getOrThrow, JsonOperationHandler, ModelState } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { CrossModelRoot, Entity, EntityNode } from '../../../language-server/generated/ast.js';
import { findDocument } from '../../../language-server/util/ast-util.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { SystemModelState } from '../model/system-model-state.js';

@injectable()
export class SystemDiagramApplyLabelEditOperationHandler extends JsonOperationHandler {
   readonly operationType = ApplyLabelEditOperation.KIND;
   @inject(ModelState) declare modelState: SystemModelState;

   createCommand(operation: ApplyLabelEditOperation): Command {
      const entityNode = getOrThrow(this.modelState.index.findEntityNode(operation.labelId), 'Entity node not found');
      const entity = getOrThrow(entityNode.entity.ref, 'Entity not found');
      const oldName = entity.name;
      return new CrossModelCommand(
         this.modelState,
         () => this.renameEntity(entityNode, entity, operation.text),
         () =>
            this.renameEntity(
               getOrThrow(this.modelState.index.findEntityNode(operation.labelId), 'Entity node not found'),
               getOrThrow(entityNode.entity.ref, 'Entity not found'),
               oldName ?? this.modelState.idProvider.findNextId(Entity, 'NewEntity')
            ),
         () =>
            this.renameEntity(
               getOrThrow(this.modelState.index.findEntityNode(operation.labelId), 'Entity node not found'),
               getOrThrow(entityNode.entity.ref, 'Entity not found'),
               operation.text
            )
      );
   }

   protected async renameEntity(entityNode: EntityNode, entity: Entity, name: string): Promise<void> {
      entity.name = name;
      const document = findDocument<CrossModelRoot>(entity)!;
      const references = Array.from(
         this.modelState.services.language.references.References.findReferences(entity, { includeDeclaration: false })
      );
      if (references.length === 0 || (references.length === 1 && references[0].sourceUri.fsPath === this.modelState.sourceUri)) {
         // if the diagram is the only reference to the entity, we can safely rename it
         // otherwise we need to ensure to implement proper rename behavior
         entity.id = this.modelState.idProvider.findNextGlobalId(Entity, toId(entity.name));
         entityNode.entity = { $refText: entity.id, ref: entity };
      }
      await this.modelState.modelService.save({
         uri: document.uri.toString(),
         model: document.parseResult.value,
         clientId: this.modelState.clientId
      });
   }
}
