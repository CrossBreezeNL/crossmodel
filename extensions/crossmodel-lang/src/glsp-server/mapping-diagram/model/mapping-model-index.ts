/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { injectable } from 'inversify';
import { AstNode } from 'langium';
import {
   AttributeMapping,
   AttributeMappingSource,
   AttributeMappingTarget,
   NumberLiteral,
   ReferenceSource,
   SourceObject,
   StringLiteral,
   isAttributeMapping,
   isAttributeMappingSource,
   isAttributeMappingTarget,
   isReferenceSource,
   isSourceObject,
   isTargetObject
} from '../../../language-server/generated/ast.js';
import { getAttributes } from '../../../language-server/util/ast-util.js';
import { CrossModelIndex } from '../../common/cross-model-index.js';

@injectable()
export class MappingModelIndex extends CrossModelIndex {
   findSourceObject(id: string): SourceObject | undefined {
      return this.findSemanticElement(id, isSourceObject);
   }

   override doFindId(node?: AstNode | undefined): string | undefined {
      const specifiedId = super.doFindId(node);
      if (specifiedId) {
         return specifiedId;
      }
      // some nodes do not have a direct id specified for them but
      // we still need to identify them to get proper mapping to graphical elements
      if (isAttributeMapping(node)) {
         return this.createAttributeMappingId(node);
      }
      if (isAttributeMappingSource(node)) {
         return this.createAttributeMappingSourceId(node);
      }
      if (isAttributeMappingTarget(node)) {
         return this.createAttributeMappingTargetId(node);
      }
      return undefined;
   }

   protected override indexAstNode(node: AstNode): void {
      super.indexAstNode(node);
      // we also want to index implicit attributes
      if (isSourceObject(node)) {
         getAttributes(node).forEach(attr => this.indexAstNode(attr));
      } else if (isTargetObject(node)) {
         getAttributes(node).forEach(attr => this.indexAstNode(attr));
      }
   }

   protected createAttributeMappingId(mapping: AttributeMapping): string | undefined {
      const sourceId = mapping.sources.map(source => this.findId(source)).join('_');
      const targetId = this.findId(mapping.attribute);
      return `${mapping.$containerIndex ?? 0}_${sourceId}_to_${targetId}`;
   }

   protected createAttributeMappingTargetId(target: AttributeMappingTarget): string | undefined {
      return this.findId(target.value.ref);
   }

   protected createAttributeMappingSourceId(source: AttributeMappingSource): string | undefined {
      return isReferenceSource(source) ? this.createReferenceSourceId(source) : this.createLiteralId(source);
   }

   protected createLiteralId(literal: NumberLiteral | StringLiteral): string {
      return `mapping_${literal.$container?.$containerIndex ?? 0}_source_${literal.$containerIndex ?? 0}_${literal.value}`;
   }

   protected createReferenceSourceId(source: ReferenceSource): string | undefined {
      return `mapping_${source.$container?.$containerIndex ?? 0}_source_${source.$containerIndex ?? 0}_${this.createId(source.value.ref)}`;
   }

   protected getIndex(node: AstNode): number {
      return node.$container?.$containerIndex ?? 0;
   }
}
