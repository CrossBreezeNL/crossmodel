/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { RELATIONSHIP_EDGE_TYPE } from '@crossbreeze/protocol';
import {
   ActionDispatcher,
   Command,
   CreateEdgeOperation,
   JsonCreateEdgeOperationHandler,
   ModelState,
   SelectAction
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { URI, Utils as UriUtils } from 'vscode-uri';
import { CrossModelRoot, EntityNode, Relationship, RelationshipEdge, isCrossModelRoot } from '../../../language-server/generated/ast.js';
import { Utils } from '../../../language-server/util/uri-util.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { SystemModelState } from '../model/system-model-state.js';

@injectable()
export class SystemDiagramCreateEdgeOperationHandler extends JsonCreateEdgeOperationHandler {
   override label = '1:1 Relationship';
   elementTypeIds = [RELATIONSHIP_EDGE_TYPE];

   @inject(ModelState) protected override modelState!: SystemModelState;
   @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

   createCommand(operation: CreateEdgeOperation): Command {
      return new CrossModelCommand(this.modelState, () => this.createEdge(operation));
   }

   protected async createEdge(operation: CreateEdgeOperation): Promise<void> {
      const sourceNode = this.modelState.index.findEntityNode(operation.sourceElementId);
      const targetNode = this.modelState.index.findEntityNode(operation.targetElementId);

      if (sourceNode && targetNode) {
         // before we can create a diagram edge, we need to create the corresponding relationship that it is based on
         const relationship = await this.createAndSaveRelationship(sourceNode, targetNode);
         if (relationship) {
            const edge: RelationshipEdge = {
               $type: RelationshipEdge,
               $container: this.modelState.systemDiagram,
               id: this.modelState.idProvider.findNextId(RelationshipEdge, relationship.id, this.modelState.systemDiagram),
               relationship: {
                  ref: relationship,
                  $refText: this.modelState.idProvider.getExternalId(relationship) || relationship.id || ''
               },
               sourceNode: {
                  ref: sourceNode,
                  $refText: this.modelState.idProvider.getNodeId(sourceNode) || sourceNode.id || ''
               },
               targetNode: {
                  ref: targetNode,
                  $refText: this.modelState.idProvider.getNodeId(targetNode) || targetNode.id || ''
               }
            };
            this.modelState.systemDiagram.edges.push(edge);
            this.actionDispatcher.dispatchAfterNextUpdate(
               SelectAction.create({ selectedElementsIDs: [this.modelState.idProvider.getLocalId(edge) ?? edge.id] })
            );
         }
      }
   }

   /**
    * Creates a new relationship and stores it on a file on the file system.
    */
   protected async createAndSaveRelationship(sourceNode: EntityNode, targetNode: EntityNode): Promise<Relationship | undefined> {
      const source = sourceNode.entity?.ref?.id || sourceNode.entity?.$refText;
      const target = targetNode.entity?.ref?.id || targetNode.entity?.$refText;

      // create relationship, serialize and re-read to ensure everything is up to date and linked properly
      const relationshipRoot: CrossModelRoot = { $type: 'CrossModelRoot' };
      const relationship: Relationship = {
         $type: Relationship,
         $container: relationshipRoot,
         id: this.modelState.idProvider.findNextId(Relationship, source + 'To' + target),
         type: '1:1',
         attributes: [],
         parent: { $refText: sourceNode.entity?.$refText || '' },
         child: { $refText: targetNode.entity?.$refText || '' }
      };

      // search for unique file name for the relationship and use file base name as relationship name
      // if the user doesn't rename any files we should end up with unique names ;-)
      const dirName = UriUtils.dirname(URI.parse(this.modelState.semanticUri));
      const targetUri = UriUtils.joinPath(dirName, relationship.id + '.relationship.cm');
      const uri = Utils.findNewUri(targetUri);

      relationshipRoot.relationship = relationship;
      const text = this.modelState.semanticSerializer.serialize(relationshipRoot);

      await this.modelState.modelService.save({ uri: uri.toString(), model: text, clientId: this.modelState.clientId });
      const root = await this.modelState.modelService.request<CrossModelRoot>(uri.toString(), isCrossModelRoot);
      return root?.relationship;
   }
}
