/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { Command, DeleteElementOperation, OperationHandler } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { DiagramEdge, DiagramNode, isDiagramEdge, isDiagramNode } from '../../language-server/generated/ast';
import { CrossModelState } from '../model/cross-model-state';
import { CrossModelCommand } from './cross-model-command';

@injectable()
export class CrossModelDeleteOperationHandler extends OperationHandler {
   operationType = DeleteElementOperation.KIND;

   @inject(CrossModelState) protected state: CrossModelState;

   createCommand(operation: DeleteElementOperation): Command | undefined {
      if (!operation.elementIds || operation.elementIds.length === 0) {
         return;
      }
      return new CrossModelCommand(this.state, () => this.deleteElements(operation));
   }

   protected deleteElements(operation: DeleteElementOperation): void {
      for (const elementId of operation.elementIds) {
         const element = this.state.index.findSemanticElement(elementId, isDiagramElement);
         if (isDiagramNode(element)) {
            this.state.diagramRoot.nodes.forEach((node, idx) => {
               if (node === element) {
                  this.state.diagramRoot.nodes.splice(idx, 1);
               }
            });
         } else if (isDiagramEdge(element)) {
            this.state.diagramRoot.edges.forEach((edge, idx) => {
               if (edge === element) {
                  this.state.diagramRoot.edges.splice(idx, 1);
               }
            });
         }
      }
   }
}

function isDiagramElement(item: unknown): item is DiagramEdge | DiagramNode {
   return isDiagramEdge(item) || isDiagramNode(item);
}
