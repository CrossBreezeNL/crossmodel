/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ValidationAcceptor, ValidationChecks } from 'langium';
import type { CrossModelServices } from './cross-model-module';
import { CrossModelAstType, Entity, Relationship } from './generated/ast';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: CrossModelServices): void {
   const registry = services.validation.ValidationRegistry;
   const validator = services.validation.CrossModelValidator;
   const checks: ValidationChecks<CrossModelAstType> = {
      Entity: validator.checkEntityStartsWithCapital,
      Relationship: validator.checkRelationshipAttributes
   };
   registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class CrossModelValidator {
   checkEntityStartsWithCapital(entity: Entity, accept: ValidationAcceptor): void {
      if (entity.name) {
         const firstChar = entity.name.substring(0, 1);
         if (firstChar.toUpperCase() !== firstChar) {
            accept('warning', 'Entity name should start with a capital.', { node: entity, property: 'name' });
         }
      }
   }

   checkRelationshipAttributes(relationship: Relationship, accept: ValidationAcceptor): void {
      if (relationship.sourceAttribute) {
         if (relationship.sourceAttribute.ref?.$container !== relationship.source.ref) {
            accept('error', 'Source attribute must come from source entity.', { node: relationship, property: 'sourceAttribute' });
         }
      }
      if (relationship.targetAttribute) {
         if (relationship.targetAttribute.ref?.$container !== relationship.target.ref) {
            accept('error', 'Target attribute must come from target entity.', { node: relationship, property: 'targetAttribute' });
         }
      }
   }
}
