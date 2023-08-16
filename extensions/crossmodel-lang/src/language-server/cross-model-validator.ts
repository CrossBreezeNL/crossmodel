/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ValidationAcceptor, ValidationChecks } from 'langium';
import type { CrossModelServices } from './cross-model-module';
import { CrossModelAstType, Entity, EntityAttribute, Relationship, SystemDiagram } from './generated/ast';

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
        Relationship: validator.checkRelationshipHasNecessaryFields
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class CrossModelValidator {
    checkSystemDiagramHasNecessaryFields(system: SystemDiagram, accept: ValidationAcceptor): void {
        console.log('test', system);
        if (!system.name) {
            accept('error', 'Systemdiagram missing id field', { node: system, property: 'name' });
        }
    }

    checkEntityHasNecessaryFields(entity: Entity, accept: ValidationAcceptor): void {
        console.log('test', entity);
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
}
