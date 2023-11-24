/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { Command, DeleteElementOperation, JsonOperationHandler } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { DiagramEdge, DiagramNode, isDiagramEdge, isDiagramNode } from '../../language-server/generated/ast.js';
import { CrossModelState } from '../model/cross-model-state.js';
import { CrossModelCommand } from './cross-model-command.js';

@injectable()
export class CrossModelDeleteOperationHandler extends JsonOperationHandler {
   operationType = DeleteElementOperation.KIND;

   @inject(CrossModelState) protected override modelState!: CrossModelState;

   createCommand(operation: DeleteElementOperation): Command | undefined {
      if (!operation.elementIds || operation.elementIds.length === 0) {
         return;
      }
      return new CrossModelCommand(this.modelState, () => this.deleteElements(operation));
   }

   protected deleteElements(operation: DeleteElementOperation): void {
      for (const elementId of operation.elementIds) {
         const element = this.modelState.index.findSemanticElement(elementId, isDiagramElement);
         // simply remove any diagram nodes or edges from the diagram
         if (isDiagramNode(element)) {
            this.modelState.diagramRoot.nodes.forEach((node, idx) => {
               if (node === element) {
                  this.modelState.diagramRoot.nodes.splice(idx, 1);
               }
            });
         } else if (isDiagramEdge(element)) {
            this.modelState.diagramRoot.edges.forEach((edge, idx) => {
               if (edge === element) {
                  this.modelState.diagramRoot.edges.splice(idx, 1);
               }
            });
         }
      }
   }
}

function isDiagramElement(item: unknown): item is DiagramEdge | DiagramNode {
   return isDiagramEdge(item) || isDiagramNode(item);
}
