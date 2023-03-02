/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { isReference, Reference } from 'langium';
import { Serializer } from '../model-server/serializer';
import { CrossModelServices } from './cross-model-module';
import {
   Attribute,
   CrossModelRoot,
   DiagramEdge,
   DiagramNode,
   Entity,
   isCrossModelRoot,
   isEntity,
   isSystemDiagram,
   Property,
   Relationship,
   SystemDiagram
} from './generated/ast';

/**
 * Hand-written AST serializer as there is currently no out-of-the box serializer from Langium, but it is on the roadmap.
 * cf. https://github.com/langium/langium/discussions/683
 * cf. https://github.com/langium/langium/discussions/863
 */
export class CrossModelSerializer implements Serializer<CrossModelRoot> {
   constructor(protected services: CrossModelServices, protected refNameProvider = services.references.QualifiedNameProvider) {}

   serialize(root: CrossModelRoot): string {
      if (root.entity) {
         return this.serializeEntity(root.entity);
      }
      if (root.relationship) {
         return this.serializeRelationship(root.relationship);
      }
      if (root.diagram) {
         return this.serializeDiagram(root.diagram);
      }
      return '';
   }

   protected serializeEntity(entity: Entity): string {
      return `entity ${entity.name} {
         description := "${entity.description}";
         attributes {
            ${this.serializeAttributes(entity.attributes)}
         }
      }`;
   }

   private serializeAttributes(attributes: Attribute[] | undefined): string {
      return attributes && Array.isArray(attributes)
         ? attributes.map(attribute => `${attribute.name} := ${attribute.value}`).join(';\n')
         : '';
   }

   protected serializeRelationship(relationship: Relationship): string {
      return `relationship ${relationship.name} {
         source := ${this.serializeReference(relationship.source)}${
         relationship.sourceAttribute ? ' with ' + this.serializeReference(relationship.sourceAttribute) : ''
      };
         target := ${this.serializeReference(relationship.target)}${
         relationship.targetAttribute ? ' with ' + this.serializeReference(relationship.targetAttribute) : ''
      };
         type := ${relationship.type};
         properties {
            ${this.serializeProperties(relationship.properties)}
         }
      }`;
   }

   private serializeProperties(properties: Property[] | undefined): string {
      return properties && Array.isArray(properties) ? properties.map(property => `${property.key} := ${property.value}`).join(';\n') : '';
   }

   protected serializeReference(reference: Reference | string | undefined): string {
      if (reference === undefined) {
         return '<unknown>';
      }
      return isReference(reference) ? reference.$refText : reference;
   }

   protected serializeDiagram(diagram: SystemDiagram): string {
      return `diagram {
         ${diagram.nodes.map(node => this.serializeDiagramNode(node)).join(';\n')}
         ${diagram.edges.map(edge => this.serializeDiagramEdge(edge)).join(';\n')}
      }`;
   }

   protected serializeDiagramNode(node: DiagramNode): string {
      return `node ${node.name} for ${node.semanticElement.$refText} {
         x := ${node.x} ;
         y := ${node.y} ;
         width := ${node.width} ;
         height := ${node.height} ;
      }`;
   }

   protected serializeDiagramEdge(edge: DiagramEdge): string {
      return `edge ${edge.name} for ${edge.semanticElement.$refText} {
         source := ${edge.source.$refText} ;
         target := ${edge.target.$refText} ;
      }`;
   }

   asDiagram(element: SystemDiagram | Entity | Relationship | CrossModelRoot): string {
      if (isCrossModelRoot(element)) {
         return element.entity
            ? this.asDiagram(element.entity)
            : element.relationship
            ? this.asDiagram(element.relationship)
            : element.diagram
            ? this.asDiagram(element.diagram)
            : 'diagram { }';
      }
      if (isSystemDiagram(element)) {
         return this.serializeDiagram(element);
      }
      if (isEntity(element)) {
         return `diagram {
            ${this.asDiagramNode(element)};
         }`;
      }
      if (!element.source.ref || !element.target.ref) {
         return 'diagram { }';
      }
      return `diagram {
         ${this.asDiagramNode(element.source.ref)};
         ${this.asDiagramNode(element.target.ref)};
         ${this.asDiagramEdge(element)}
      }`;
   }

   protected toDiagramName(element: Entity | Relationship): string {
      return isEntity(element) ? element.name + '_node' : element.name + '_edge';
   }

   protected asDiagramNode(entity: Entity): string {
      return `node ${this.toDiagramName(entity)} for ${this.refNameProvider.getName(entity)} {
         x := 0;
         y := 0;
         width := 100;
         height := 100;
      }`;
   }

   protected asDiagramEdge(relationship: Relationship): string {
      return `edge ${this.toDiagramName(relationship)} for ${this.refNameProvider.getName(relationship)} {
         source := ${this.toDiagramName(relationship.source.ref!)};
         target := ${this.toDiagramName(relationship.target.ref!)};
      }`;
   }
}
