/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { inject, injectable } from 'inversify';
import { CrossModelRoot, Mapping } from '../../../language-server/generated/ast.js';
import { createAttributeMapping, getAttributes } from '../../../language-server/util/ast-util.js';
import { CrossModelState } from '../../common/cross-model-state.js';
import { MappingModelIndex } from './mapping-model-index.js';

@injectable()
export class MappingModelState extends CrossModelState {
   @inject(MappingModelIndex) override readonly index: MappingModelIndex;

   override setSemanticRoot(uri: string, semanticRoot: CrossModelRoot): void {
      this.ensureAttributeMappings(semanticRoot);
      super.setSemanticRoot(uri, semanticRoot);
   }

   protected ensureAttributeMappings(semanticRoot: CrossModelRoot): void {
      if (semanticRoot.mapping) {
         const target = semanticRoot.mapping.target;
         const targetAttributes = target ? getAttributes(target) : [];
         // we want to ensure that each target attribute has a mapping that we can manipulate in our editor
         // the change will automatically be persisted with the next change that is done
         targetAttributes.forEach(targetAttribute => {
            if (!target.mappings.find(mapping => mapping.attribute.value.ref === targetAttribute)) {
               const mapping = createAttributeMapping(target, undefined, targetAttribute.id);
               (mapping.attribute.value as any).ref = targetAttribute;
               target.mappings.push(mapping);
            }
         });
      }
   }

   get mapping(): Mapping {
      return this.semanticRoot.mapping!;
   }
}
