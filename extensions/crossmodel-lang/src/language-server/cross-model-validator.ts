/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AstNode, ValidationAcceptor, ValidationChecks } from 'langium';
import type { CrossModelServices } from './cross-model-module.js';
import { ID_PROPERTY } from './cross-model-naming.js';
import {
   CrossModelAstType,
   DiagramEdge,
   Mapping,
   SourceObject,
   SystemDiagram,
   isEntity,
   isEntityAttribute,
   isRelationship,
   isSystemDiagram
} from './generated/ast.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: CrossModelServices): void {
   const registry = services.validation.ValidationRegistry;
   const validator = services.validation.CrossModelValidator;

   const checks: ValidationChecks<CrossModelAstType> = {
      AstNode: validator.checkUniqueId,
      DiagramEdge: validator.checkDiagramEdge,
      SystemDiagram: validator.checkUniqueIdWithinDiagram,
      Mapping: validator.checkUniqueIdWithinMapping,
      SourceObject: validator.checkSourceObject
   };
   registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class CrossModelValidator {
   constructor(protected services: CrossModelServices) {}

   checkUniqueId(node: AstNode, accept: ValidationAcceptor): void {
      const elementName = this.services.references.IdProvider.getNodeId(node);
      if (!elementName) {
         if (this.shouldHaveId(node)) {
            accept('error', 'Missing required id field', { node, property: ID_PROPERTY });
         }
         return;
      }
      const allElements = Array.from(this.services.shared.workspace.IndexManager.allElements());
      const duplicates = allElements.filter(description => description.name === elementName);
      if (duplicates.length > 1) {
         accept('error', 'Must provide a unique id.', { node, property: ID_PROPERTY });
      }
   }

   protected shouldHaveId(node: AstNode): boolean {
      return isEntity(node) || isEntityAttribute(node) || isRelationship(node) || isSystemDiagram(node);
   }

   checkUniqueIdWithinDiagram(diagram: SystemDiagram, accept: ValidationAcceptor): void {
      const knownIds: string[] = [];
      for (const node of diagram.nodes) {
         if (node.id && knownIds.includes(node.id)) {
            accept('error', 'Must provide a unique id.', { node, property: ID_PROPERTY });
         } else if (node.id) {
            knownIds.push(node.id);
         }
      }
      for (const edge of diagram.edges) {
         if (edge.id && knownIds.includes(edge.id)) {
            accept('error', 'Must provide a unique id.', { node: edge, property: ID_PROPERTY });
         } else if (edge.id) {
            knownIds.push(edge.id);
         }
      }
   }

   checkUniqueIdWithinMapping(mapping: Mapping, accept: ValidationAcceptor): void {
      const knownIds: string[] = [];
      for (const node of mapping.sourceObjects) {
         if (node.id && knownIds.includes(node.id)) {
            accept('error', 'Must provide a unique id.', { node, property: ID_PROPERTY });
         } else if (node.id) {
            knownIds.push(node.id);
         }
      }
   }

   checkDiagramEdge(edge: DiagramEdge, accept: ValidationAcceptor): void {
      if (edge.sourceNode?.ref?.entity?.ref?.$type !== edge.relationship?.ref?.parent?.ref?.$type) {
         accept('error', 'Source must match type of parent.', { node: edge, property: 'sourceNode' });
      }
      if (edge.targetNode?.ref?.entity?.ref?.$type !== edge.relationship?.ref?.child?.ref?.$type) {
         accept('error', 'Target must match type of child.', { node: edge, property: 'targetNode' });
      }
   }

   checkSourceObject(obj: SourceObject, accept: ValidationAcceptor): void {
      if (obj.join === 'from' && obj.relations.length > 0) {
         accept('error', 'Source objects with join type "from" cannot have relations.', { node: obj, property: 'relations' });
      }
   }
}
