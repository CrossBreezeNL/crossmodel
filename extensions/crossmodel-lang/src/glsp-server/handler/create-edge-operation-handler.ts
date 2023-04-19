/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import {
   Command,
   CreateEdgeOperation,
   CreateOperationHandler,
   CreateOperationKind,
   DefaultTypes,
   OperationHandler,
   TriggerEdgeCreationAction,
   TriggerNodeCreationAction
} from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { URI, Utils as UriUtils } from 'vscode-uri';
import { CrossModelRoot, DiagramEdge, DiagramNode, isCrossModelRoot, Relationship } from '../../language-server/generated/ast';
import { Utils } from '../../language-server/util/uri-util';
import { CrossModelState } from '../model/cross-model-state';
import { CrossModelCommand } from './cross-model-command';

@injectable()
export class CrossModelCreateEdgeOperationHandler extends OperationHandler implements CreateOperationHandler {
   override label = '1:1 Relationship';
   elementTypeIds = [DefaultTypes.EDGE];
   operationType: CreateOperationKind = CreateEdgeOperation.KIND;

   @inject(CrossModelState) protected state: CrossModelState;

   getTriggerActions(): (TriggerEdgeCreationAction | TriggerNodeCreationAction)[] {
      return this.elementTypeIds.map(typeId => TriggerEdgeCreationAction.create(typeId));
   }

   createCommand(operation: CreateEdgeOperation): Command {
      return new CrossModelCommand(this.state, () => this.createEdge(operation));
   }

   protected async createEdge(operation: CreateEdgeOperation): Promise<void> {
      const sourceNode = this.state.index.findDiagramNode(operation.sourceElementId);
      const targetNode = this.state.index.findDiagramNode(operation.targetElementId);
      if (sourceNode && targetNode) {
         const relationship = await this.createAndSaveRelationship(sourceNode, targetNode);
         if (relationship) {
            const edge: DiagramEdge = {
               $type: 'DiagramEdge',
               $container: this.state.diagramRoot,
               name: relationship.name,
               semanticElement: { ref: relationship, $refText: this.state.nameProvider.getName(relationship) || relationship.name },
               source: { ref: sourceNode, $refText: this.state.nameProvider.getLocalName(sourceNode) || sourceNode.name },
               target: { ref: targetNode, $refText: this.state.nameProvider.getLocalName(targetNode) || targetNode.name }
            };
            this.state.diagramRoot.edges.push(edge);
         }
      }
   }

   protected async createAndSaveRelationship(sourceNode: DiagramNode, targetNode: DiagramNode): Promise<Relationship | undefined> {
      const source = sourceNode.semanticElement.ref?.name || sourceNode.semanticElement.$refText;
      const target = targetNode.semanticElement.ref?.name || targetNode.semanticElement.$refText;

      // search for unique file name for the relationship and use file base name as relationship name
      // if the user doesn't rename any files we should end up with unique names ;-)
      const dirName = UriUtils.dirname(URI.parse(this.state.semanticUri));
      const targetUri = UriUtils.joinPath(dirName, source + 'To' + target + '.relationship.cm');
      const uri = Utils.findNewUri(targetUri);
      const name = UriUtils.basename(uri).split('.')[0];

      const relationshipRoot: CrossModelRoot = { $type: 'CrossModelRoot' };
      const relationship: Relationship = {
         $type: 'Relationship',
         $container: relationshipRoot,
         name,
         type: '1:1',
         properties: [],
         source: { $refText: sourceNode.semanticElement.$refText },
         target: { $refText: targetNode.semanticElement.$refText }
      };
      relationshipRoot.relationship = relationship;
      const text = this.state.semanticSerializer.serialize(relationshipRoot);

      await this.state.modelService.save(uri.toString(), text);
      const root = await this.state.modelService.request<CrossModelRoot>(uri.toString(), isCrossModelRoot);
      return root?.relationship;
   }
}