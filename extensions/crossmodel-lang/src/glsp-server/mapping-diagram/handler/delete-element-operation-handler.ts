/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { Command, DeleteElementOperation, GEdge, GNode, JsonOperationHandler, ModelState, remove } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import {
   AttributeMapping,
   SourceObject,
   SourceObjectRelations,
   isAttributeMapping,
   isNumberLiteral,
   isReferenceSource,
   isSourceObject,
   isStringLiteral
} from '../../../language-server/generated/ast.js';
import { getOwner } from '../../../language-server/util/ast-util.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { MappingModelState } from '../model/mapping-model-state.js';

@injectable()
export class MappingDiagramDeleteElementOperationHandler extends JsonOperationHandler {
   override operationType = DeleteElementOperation.KIND;

   @inject(ModelState) protected override modelState!: MappingModelState;

   override createCommand(operation: DeleteElementOperation): Command | undefined {
      const deleteInfo = this.findElementsToDelete(operation);
      if (deleteInfo.sources.length === 0 && deleteInfo.mapping.length === 0) {
         return undefined;
      }

      return new CrossModelCommand(this.modelState, () => this.deleteElements(deleteInfo));
   }

   protected deleteElements(deleteInfo: DeleteInfo): void {
      const container = this.modelState.mapping.sources;
      remove(container, ...deleteInfo.sources);

      const mappings = this.modelState.mapping.target.mappings;
      remove(mappings, ...deleteInfo.mapping);

      deleteInfo.relations.forEach(relation => remove(relation.$container.relations, relation));
   }

   protected findElementsToDelete(operation: DeleteElementOperation): DeleteInfo {
      const deleteInfo: DeleteInfo = { sources: [], mapping: [], relations: [] };
      const mapping = this.modelState.mapping;
      operation.elementIds.forEach(id => {
         const graphElement = this.modelState.index.get(id);
         if (graphElement instanceof GNode) {
            const astNode = this.modelState.index.findSemanticElement(id);
            if (isSourceObject(astNode)) {
               deleteInfo.mapping.push(
                  ...mapping.target.mappings.filter(
                     attributeMapping =>
                        isReferenceSource(attributeMapping.source) &&
                        attributeMapping.source.value.ref &&
                        getOwner(attributeMapping.source.value?.ref) === astNode
                  )
               );
               deleteInfo.sources.push(astNode);
               deleteInfo.relations.push(
                  ...mapping.sources.flatMap(source => source.relations).filter(relation => relation.source.ref === astNode)
               );
            } else if (isStringLiteral(astNode) || isNumberLiteral(astNode)) {
               // Literal nodes are contained by the corresponding targetAttributeMapping=> we only have to delete
               // the mapping that correlates to the outgoing edge of the literal node
               this.modelState.index.getOutgoingEdges(graphElement).forEach(edge => {
                  const attributeMapping = this.modelState.index.findSemanticElement(edge.id, isAttributeMapping);
                  if (attributeMapping) {
                     deleteInfo.mapping.push(attributeMapping);
                  }
               });
            }
         } else if (graphElement instanceof GEdge) {
            const attributeMapping = this.modelState.index.findSemanticElement(graphElement.id, isAttributeMapping);
            if (attributeMapping) {
               deleteInfo.mapping.push(attributeMapping);
            }
         }
      });
      return deleteInfo;
   }
}

interface DeleteInfo {
   sources: SourceObject[];
   mapping: AttributeMapping[];
   relations: SourceObjectRelations[];
}
