/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AstNode, ValidationAcceptor, ValidationChecks } from 'langium';
import type { CrossModelServices } from './cross-model-module.js';
import { ID_PROPERTY } from './cross-model-naming.js';
import {
   CrossModelAstType,
   DiagramEdge,
   isDiagramEdge,
   isDiagramNode,
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
      DiagramEdge: validator.checkDiagramEdge
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
      return (
         isEntity(node) ||
         isEntityAttribute(node) ||
         isRelationship(node) ||
         isSystemDiagram(node) ||
         isDiagramEdge(node) ||
         isDiagramNode(node)
      );
   }

   checkDiagramEdge(edge: DiagramEdge, accept: ValidationAcceptor): void {
      if (edge.sourceNode?.ref?.entity?.ref?.$type !== edge.relationship?.ref?.parent?.ref?.$type) {
         accept('error', 'Source must match type of parent', { node: edge, property: 'sourceNode' });
      }
      if (edge.targetNode?.ref?.entity?.ref?.$type !== edge.relationship?.ref?.child?.ref?.$type) {
         accept('error', 'Target must match type of child', { node: edge, property: 'targetNode' });
      }
   }
}
