/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/
import { INHERITANCE_EDGE_TYPE } from '@crossbreeze/protocol';
import {
   ActionDispatcher,
   Command,
   CompoundCommand,
   CreateEdgeOperation,
   JsonCreateEdgeOperationHandler,
   MaybePromise,
   MessageAction,
   ModelState,
   SelectAction,
   getOrThrow
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { CrossModelRoot, Entity, EntityNode, InheritanceEdge, isInheritanceEdge } from '../../../language-server/generated/ast.js';
import { findDocument } from '../../../language-server/util/ast-util.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { SystemModelState } from '../model/system-model-state.js';

@injectable()
export class SystemDiagramCreateInheritanceOperationHandler extends JsonCreateEdgeOperationHandler {
   override readonly label = 'Inheritance';
   readonly elementTypeIds = [INHERITANCE_EDGE_TYPE];

   @inject(ModelState) protected override modelState: SystemModelState;
   @inject(ActionDispatcher) protected actionDispatcher: ActionDispatcher;

   createCommand(operation: CreateEdgeOperation): MaybePromise<Command | undefined> {
      const baseEntityNode = getOrThrow(this.modelState.index.findEntityNode(operation.sourceElementId), 'Base entity node not found');
      const superEntityNode = getOrThrow(this.modelState.index.findEntityNode(operation.targetElementId), 'Super entity node not found');
      if (!baseEntityNode.entity.ref || !superEntityNode.entity.ref) {
         return undefined;
      }

      // If a matching inheritance edge already exists, we don't need to create a new one
      if (this.hasExistingInheritanceEdge(baseEntityNode, superEntityNode)) {
         return undefined;
      }

      if (hasSuperEntity(superEntityNode.entity.ref, baseEntityNode.entity.ref)) {
         this.actionDispatcher.dispatch(
            MessageAction.create('Could not create inheritance. Circular inheritance is not allowed.', { severity: 'WARNING' })
         );
         return undefined;
      }

      const diagramCommand = new CrossModelCommand(this.modelState, () => this.createEdge(baseEntityNode, superEntityNode));
      const existingSemanticInheritance = hasSuperEntity(baseEntityNode.entity.ref, superEntityNode.entity.ref);
      if (existingSemanticInheritance) {
         return diagramCommand;
      }

      // Check if the given superEntity is valid i.e. in  the completion scope of the baseEntity
      const baseEntityGlobalId = this.modelState.idProvider.getGlobalId(baseEntityNode.entity.ref);
      const scope = this.modelState.services.language.references.ScopeProvider.getCompletionScope({
         container: { globalId: baseEntityGlobalId! },
         property: 'superEntities'
      });

      const superEntityGlobalId = this.modelState.idProvider.getGlobalId(superEntityNode.entity.ref)!;
      const isInScope = scope.elementScope.getElement(superEntityNode.entity.ref.id) ?? scope.elementScope.getElement(superEntityGlobalId);
      if (!isInScope) {
         return undefined;
      }

      return new CompoundCommand(new AddInheritanceCommand(this.modelState, operation), diagramCommand);
   }

   protected hasExistingInheritanceEdge(baseEntityNode: EntityNode, superEntityNode: EntityNode): boolean {
      const existingInheritanceEdge = this.modelState.systemDiagram.edges.find(edge => {
         if (!isInheritanceEdge(edge)) {
            return false;
         }
         if (edge.baseNode.ref?.entity.ref === baseEntityNode.entity.ref && edge.superNode.ref?.entity.ref === superEntityNode.entity.ref) {
            return true;
         }
         return false;
      });
      return !!existingInheritanceEdge;
   }

   protected async createEdge(baseEntityNode: EntityNode, superEntityNode: EntityNode): Promise<void> {
      const edge: InheritanceEdge = {
         $type: InheritanceEdge,
         $container: this.modelState.systemDiagram,
         id: this.modelState.idProvider.findNextId(InheritanceEdge, baseEntityNode.id + 'InheritanceEdge', this.modelState.systemDiagram),

         baseNode: {
            ref: baseEntityNode,
            $refText: this.modelState.idProvider.getNodeId(baseEntityNode) || baseEntityNode.id || ''
         },
         superNode: {
            ref: superEntityNode,
            $refText: this.modelState.idProvider.getNodeId(superEntityNode) || superEntityNode.id || ''
         },
         customProperties: []
      };
      this.modelState.systemDiagram.edges.push(edge);
      this.actionDispatcher.dispatchAfterNextUpdate(
         SelectAction.create({ selectedElementsIDs: [this.modelState.idProvider.getLocalId(edge) ?? edge.id] })
      );
   }
}

export class AddInheritanceCommand implements Command {
   protected _canUndo = false;

   constructor(
      protected modelState: SystemModelState,
      protected operation: CreateEdgeOperation
   ) {}

   async execute(): Promise<void> {
      if (this.canUndo()) {
         return;
      }

      const baseEntity = this.modelState.index.findEntityNode(this.operation.sourceElementId)?.entity.ref;
      const superEntity = this.modelState.index.findEntityNode(this.operation.targetElementId)?.entity.ref;
      if (!baseEntity || !superEntity) {
         return;
      }
      if (hasSuperEntity(baseEntity, superEntity)) {
         return;
      }

      baseEntity.superEntities.push({
         ref: superEntity,
         $refText: this.modelState.idProvider.getGlobalId(superEntity) || superEntity.id || ''
      });

      const document = findDocument<CrossModelRoot>(baseEntity)!;
      await this.modelState.modelService.save({
         uri: document.uri.toString(),
         model: document.parseResult.value,
         clientId: this.modelState.clientId
      });

      this._canUndo = true;
   }

   async undo(): Promise<void> {
      if (!this.canUndo()) {
         return;
      }

      const baseEntity = this.modelState.index.findEntityNode(this.operation.sourceElementId)?.entity.ref;
      const superEntity = this.modelState.index.findEntityNode(this.operation.targetElementId)?.entity.ref;
      if (!baseEntity || !superEntity) {
         return;
      }
      const index = baseEntity.superEntities.findIndex(entity => entity.ref === superEntity);
      if (index > -1) {
         baseEntity.superEntities?.splice(index, 1);
      }
      const document = findDocument<CrossModelRoot>(baseEntity)!;
      await this.modelState.modelService.save({
         uri: document.uri.toString(),
         model: document.parseResult.value,
         clientId: this.modelState.clientId
      });

      this._canUndo = false;
   }

   redo(): MaybePromise<void> {
      if (this.canUndo()) {
         return;
      }
      return this.execute();
   }

   canUndo(): boolean {
      return this._canUndo;
   }
}

function hasSuperEntity(baseEntity: Entity, superEntity: Entity): boolean {
   return baseEntity.superEntities.some(entity => entity.ref === superEntity);
}
