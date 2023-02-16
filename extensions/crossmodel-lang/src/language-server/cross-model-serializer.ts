/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelServices } from './cross-model-module';
import { CrossModelRoot, Entity, Relationship } from './generated/ast';

/**
 * Hand-written AST serializer as there is currently no out-of-the box serializer from Langium, but it is on the roadmap.
 * cf. https://github.com/langium/langium/discussions/683
 * cf. https://github.com/langium/langium/discussions/863
 */
export class CrossModelSerializer {
   constructor(protected services: CrossModelServices, protected refNameProvider = services.references.QualifiedNameProvider) {}

   serialize(root: CrossModelRoot): string {
      if (root.entity) {
         return this.serializeEntity(root.entity);
      }
      if (root.relationship) {
         return this.serializeRelationship(root.relationship);
      }
      return '';
   }

   protected serializeEntity(entity: Entity): string {
      return `entity ${entity.name} {
         description ${entity.description};
         attributes {
            ${entity.attributes.map(attribute => `${attribute.name} := ${attribute.value}`).join(';\n')}
         }
      }`;
   }

   protected serializeRelationship(relationship: Relationship): string {
      return `relationship ${relationship.name} {
         source := ${relationship.source.$refText}${relationship.sourceAttribute ? ' with ' + relationship.sourceAttribute?.$refText : ''};
         target := ${relationship.target.$refText}${relationship.targetAttribute ? ' with ' + relationship.targetAttribute?.$refText : ''};
         type := ${relationship.type};
         properties {
            ${relationship.properties.map(property => `${property.key} := ${property.value}`).join(';\n')}
         }
      }`;
   }
}
