/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelServices } from './cross-model-module';
import {
   CrossModelRoot,
   DiagramEdge,
   DiagramNode,
   Entity,
   isCrossModelRoot,
   isEntity,
   isSystemDiagram,
   Relationship,
   SystemDiagram
} from './generated/ast';

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
      if (root.diagram) {
         return this.serializeDiagram(root.diagram);
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
