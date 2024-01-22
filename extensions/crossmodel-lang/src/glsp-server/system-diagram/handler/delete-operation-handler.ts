/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { Command, DeleteElementOperation, JsonOperationHandler, ModelState, remove } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { EntityNode, RelationshipEdge, isEntityNode, isRelationshipEdge } from '../../../language-server/generated/ast.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { SystemModelState } from '../model/system-model-state.js';

@injectable()
export class SystemDiagramDeleteOperationHandler extends JsonOperationHandler {
   operationType = DeleteElementOperation.KIND;

   @inject(ModelState) protected override modelState!: SystemModelState;

   override createCommand(operation: DeleteElementOperation): Command | undefined {
      const deleteInfo = this.findElementsToDelete(operation);
      if (deleteInfo.nodes.length === 0 && deleteInfo.edges.length === 0) {
         return undefined;
      }
      return new CrossModelCommand(this.modelState, () => this.deleteElements(deleteInfo));
   }

   protected deleteElements(deleteInfo: DeleteInfo): void {
      const nodes = this.modelState.systemDiagram.nodes;
      remove(nodes, ...deleteInfo.nodes);

      const edges = this.modelState.systemDiagram.edges;
      remove(edges, ...deleteInfo.edges);
   }

   protected findElementsToDelete(operation: DeleteElementOperation): DeleteInfo {
      const deleteInfo: DeleteInfo = { edges: [], nodes: [] };

      for (const elementId of operation.elementIds) {
         const element = this.modelState.index.findSemanticElement(elementId, isDiagramElement);
         // simply remove any diagram nodes or edges from the diagram
         if (isEntityNode(element)) {
            deleteInfo.nodes.push(element);
            deleteInfo.edges.push(
               ...this.modelState.systemDiagram.edges.filter(edge => edge.sourceNode?.ref === element || edge.targetNode?.ref === element)
            );
         } else if (isRelationshipEdge(element)) {
            deleteInfo.edges.push(element);
         }
      }
      return deleteInfo;
   }
}

function isDiagramElement(item: unknown): item is RelationshipEdge | EntityNode {
   return isRelationshipEdge(item) || isEntityNode(item);
}

interface DeleteInfo {
   nodes: EntityNode[];
   edges: RelationshipEdge[];
}
