/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ChangeBoundsOperation, Command, OperationHandler } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { CrossModelState } from '../model/cross-model-state';
import { CrossModelCommand } from './cross-model-command';

@injectable()
export class CrossModelChangeBoundsOperationHandler extends OperationHandler {
   operationType = ChangeBoundsOperation.KIND;

   @inject(CrossModelState) protected state: CrossModelState;

   createCommand(operation: ChangeBoundsOperation): Command {
      return new CrossModelCommand(this.state, () => this.changeBounds(operation));
   }

   protected changeBounds(operation: ChangeBoundsOperation): void {
      operation.newBounds.forEach(elementAndBounds => {
         const node = this.state.index.findDiagramNode(elementAndBounds.elementId);
         if (node) {
            node.x = elementAndBounds.newPosition?.x || node.x;
            node.y = elementAndBounds.newPosition?.y || node.y;
            node.width = elementAndBounds.newSize.width;
            node.height = elementAndBounds.newSize.height;
         }
      });
   }
}
