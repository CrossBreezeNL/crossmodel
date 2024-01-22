/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { DropEntityOperation } from '@crossbreeze/protocol';
import { Command, JsonOperationHandler, ModelState } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { URI } from 'vscode-uri';
import { CrossModelRoot, EntityNode, isCrossModelRoot } from '../../../language-server/generated/ast.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { SystemModelState } from '../model/system-model-state.js';

/**
 * An operation handler for the 'DropEntityOperation' that finds an entity for each of the given file URIs and
 * creates a new node on the diagram for each of the found entities. If multiple entities are placed on the diagram
 * their position is shifted by (10,10) so they do not fully overlap.
 */
@injectable()
export class SystemDiagramDropEntityOperationHandler extends JsonOperationHandler {
   override operationType = DropEntityOperation.KIND;

   @inject(ModelState) protected override modelState!: SystemModelState;

   createCommand(operation: DropEntityOperation): Command {
      return new CrossModelCommand(this.modelState, () => this.createEntityNode(operation));
   }

   protected async createEntityNode(operation: DropEntityOperation): Promise<void> {
      const container = this.modelState.systemDiagram;
      let x = operation.position.x;
      let y = operation.position.y;
      for (const filePath of operation.filePaths) {
         const root = await this.modelState.modelService.request<CrossModelRoot>(URI.file(filePath).toString(), isCrossModelRoot);
         if (root?.entity) {
            // create node for entity
            const node: EntityNode = {
               $type: EntityNode,
               $container: container,
               id: this.modelState.idProvider.findNextId(EntityNode, root.entity.id + 'Node', this.modelState.systemDiagram),
               entity: {
                  $refText: this.modelState.idProvider.getExternalId(root.entity) || root.entity.id || '',
                  ref: root.entity
               },
               x: (x += 10),
               y: (y += 10),
               width: 10,
               height: 10
            };
            container.nodes.push(node);
         }
      }
   }
}
