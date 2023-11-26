/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { Command, CreateEdgeOperation, DefaultTypes, JsonCreateEdgeOperationHandler, ModelState } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { URI, Utils as UriUtils } from 'vscode-uri';
import { CrossModelRoot, DiagramEdge, DiagramNode, Relationship, isCrossModelRoot } from '../../language-server/generated/ast.js';
import { Utils } from '../../language-server/util/uri-util.js';
import { CrossModelState } from '../model/cross-model-state.js';
import { CrossModelCommand } from './cross-model-command.js';

@injectable()
export class CrossModelCreateEdgeOperationHandler extends JsonCreateEdgeOperationHandler {
   override label = '1:1 Relationship';
   elementTypeIds = [DefaultTypes.EDGE];

   @inject(ModelState) protected override modelState!: CrossModelState;

   createCommand(operation: CreateEdgeOperation): Command {
      return new CrossModelCommand(this.modelState, () => this.createEdge(operation));
   }

   protected async createEdge(operation: CreateEdgeOperation): Promise<void> {
      const sourceNode = this.modelState.index.findDiagramNode(operation.sourceElementId);
      const targetNode = this.modelState.index.findDiagramNode(operation.targetElementId);

      if (sourceNode && targetNode) {
         // before we can create a diagram edge, we need to create the corresponding relationship that it is based on
         const relationship = await this.createAndSaveRelationship(sourceNode, targetNode);
         if (relationship) {
            const edge: DiagramEdge = {
               $type: DiagramEdge,
               $container: this.modelState.diagramRoot,
               id: relationship.id,
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
            this.modelState.diagramRoot.edges.push(edge);
         }
      }
   }

   /**
    * Creates a new relationship and stores it on a file on the file system.
    */
   protected async createAndSaveRelationship(sourceNode: DiagramNode, targetNode: DiagramNode): Promise<Relationship | undefined> {
      const source = sourceNode.entity?.ref?.id || sourceNode.entity?.$refText;
      const target = targetNode.entity?.ref?.id || targetNode.entity?.$refText;

      // search for unique file name for the relationship and use file base name as relationship name
      // if the user doesn't rename any files we should end up with unique names ;-)
      const dirName = UriUtils.dirname(URI.parse(this.modelState.semanticUri));
      const targetUri = UriUtils.joinPath(dirName, source + 'To' + target + '.relationship.cm');
      const uri = Utils.findNewUri(targetUri);
      const id = UriUtils.basename(uri).split('.')[0];

      // create relationship, serialize and re-read to ensure everything is up to date and linked properly
      const relationshipRoot: CrossModelRoot = { $type: 'CrossModelRoot' };
      const relationship: Relationship = {
         $type: Relationship,
         $container: relationshipRoot,
         id,
         type: '1:1',
         parent: { $refText: sourceNode.entity?.$refText || '' },
         child: { $refText: targetNode.entity?.$refText || '' }
      };
      relationshipRoot.relationship = relationship;
      const text = this.modelState.semanticSerializer.serialize(relationshipRoot);

      await this.modelState.modelService.save({ uri: uri.toString(), model: text, clientId: this.modelState.clientId });
      const root = await this.modelState.modelService.request<CrossModelRoot>(uri.toString(), isCrossModelRoot);
      return root?.relationship;
   }
}
