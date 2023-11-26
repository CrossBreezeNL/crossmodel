/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ValidationAcceptor, ValidationChecks } from 'langium';
import type { CrossModelServices } from './cross-model-module.js';
import { CrossModelAstType, DiagramEdge, Entity, EntityAttribute, Relationship, SystemDiagram } from './generated/ast.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: CrossModelServices): void {
   const registry = services.validation.ValidationRegistry;
   const validator = services.validation.CrossModelValidator;

   const checks: ValidationChecks<CrossModelAstType> = {
      Entity: validator.checkEntityHasNecessaryFields,
      EntityAttribute: validator.checkAttributeHasNecessaryFields,
      SystemDiagram: validator.checkSystemDiagramHasNecessaryFields,
      Relationship: validator.checkRelationshipHasNecessaryFields,
      DiagramEdge: validator.checkDiagramEdge
   };
   registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class CrossModelValidator {
   checkSystemDiagramHasNecessaryFields(system: SystemDiagram, accept: ValidationAcceptor): void {
      if (!system.name) {
         accept('error', 'SystemDiagram missing id field', { node: system, property: 'name' });
      }
   }

   checkEntityHasNecessaryFields(entity: Entity, accept: ValidationAcceptor): void {
      if (!entity.name) {
         accept('error', 'Entity missing id field', { node: entity, property: 'name' });
      }
   }

   checkAttributeHasNecessaryFields(attribute: EntityAttribute, accept: ValidationAcceptor): void {
      if (!attribute.name) {
         accept('error', 'Attribute missing id field', { node: attribute, property: 'name' });
      }
   }

   checkRelationshipHasNecessaryFields(relationship: Relationship, accept: ValidationAcceptor): void {
      if (!relationship.name) {
         accept('error', 'Attribute missing id field', { node: relationship, property: 'name' });
      }
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
