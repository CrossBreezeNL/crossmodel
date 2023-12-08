/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AstNode, ValidationAcceptor, ValidationChecks } from 'langium';
import type { CrossModelServices } from './cross-model-module.js';
import { ID_PROPERTY, IdentifiableAstNode } from './cross-model-naming.js';
import {
   CrossModelAstType,
   DiagramEdge,
   SourceObject,
   isEntity,
   isEntityAttribute,
   isMapping,
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
      AstNode: validator.checkNode,
      DiagramEdge: validator.checkDiagramEdge,
      SourceObject: validator.checkSourceObject
   };
   registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class CrossModelValidator {
   constructor(protected services: CrossModelServices) {}

   checkNode(node: AstNode, accept: ValidationAcceptor): void {
      this.checkUniqueExternalId(node, accept);
      this.checkUniqueNodeId(node, accept);
   }

   protected checkUniqueExternalId(node: AstNode, accept: ValidationAcceptor): void {
      if (!this.isExported(node)) {
         return;
      }
      const externalId = this.services.references.IdProvider.getExternalId(node);
      if (!externalId) {
         accept('error', 'Missing required id field', { node, property: ID_PROPERTY });
         return;
      }
      const allElements = Array.from(this.services.shared.workspace.IndexManager.allElements());
      const duplicates = allElements.filter(description => description.name === externalId);
      if (duplicates.length > 1) {
         accept('error', 'Must provide a unique id.', { node, property: ID_PROPERTY });
      }
   }

   protected isExported(node: AstNode): boolean {
      // we export anything with an id from entities and relationships and all root nodes, see CrossModelScopeComputation
      return isEntity(node) || isEntityAttribute(node) || isRelationship(node) || isSystemDiagram(node) || isMapping(node);
   }

   protected checkUniqueNodeId(node: AstNode, accept: ValidationAcceptor): void {
      if (isSystemDiagram(node)) {
         this.markDuplicateIds(node.edges, accept);
         this.markDuplicateIds(node.nodes, accept);
      }
      if (isMapping(node)) {
         this.markDuplicateIds(node.sourceObjects, accept);
      }
   }

   protected markDuplicateIds(nodes: IdentifiableAstNode[], accept: ValidationAcceptor): void {
      const knownIds: string[] = [];
      for (const node of nodes) {
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
