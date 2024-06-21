/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { findAllExpressions, getExpression, getExpressionPosition, getExpressionText } from '@crossbreeze/protocol';
import { AstNode, Reference, ValidationAcceptor, ValidationChecks, findNodeForProperty } from 'langium';
import type { CrossModelServices } from './cross-model-module.js';
import { ID_PROPERTY, IdentifiableAstNode } from './cross-model-naming.js';
import {
   Attribute,
   AttributeMapping,
   CrossModelAstType,
   Mapping,
   Relationship,
   RelationshipEdge,
   SourceObject,
   SourceObjectAttribute,
   SourceObjectCondition,
   SourceObjectDependency,
   TargetObject,
   TargetObjectAttribute,
   isEntity,
   isEntityAttribute,
   isMapping,
   isRelationship,
   isSystemDiagram
} from './generated/ast.js';
import { findDocument, getOwner } from './util/ast-util.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: CrossModelServices): void {
   const registry = services.validation.ValidationRegistry;
   const validator = services.validation.CrossModelValidator;

   const checks: ValidationChecks<CrossModelAstType> = {
      AstNode: validator.checkNode,
      RelationshipEdge: validator.checkRelationshipEdge,
      Mapping: validator.checkMapping,
      SourceObject: validator.checkSourceObject,
      Relationship: validator.checkRelationship,
      AttributeMapping: validator.checkAttributeMapping,
      TargetObject: validator.checkTargetObject,
      SourceObjectDependency: validator.checkSourceObjectDependency,
      SourceObjectCondition: validator.checkSourceObjectCondition
   };
   registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class CrossModelValidator {
   constructor(protected services: CrossModelServices) {}

   checkNode(node: AstNode, accept: ValidationAcceptor): void {
      this.checkUniqueGlobalId(node, accept);
      this.checkUniqueNodeId(node, accept);
   }

   protected checkUniqueGlobalId(node: AstNode, accept: ValidationAcceptor): void {
      if (!this.isExportedGlobally(node)) {
         return;
      }
      const globalId = this.services.references.IdProvider.getGlobalId(node);
      if (!globalId) {
         accept('error', 'Missing required id field', { node, property: ID_PROPERTY });
         return;
      }
      const allElements = Array.from(this.services.shared.workspace.IndexManager.allElements());
      const duplicates = allElements.filter(description => description.name === globalId);
      if (duplicates.length > 1) {
         accept('error', 'Must provide a unique id.', { node, property: ID_PROPERTY });
      }
   }

   protected isExportedGlobally(node: AstNode): boolean {
      // we export anything with an id from entities and relationships and all root nodes, see CrossModelScopeComputation
      return isEntity(node) || isEntityAttribute(node) || isRelationship(node) || isSystemDiagram(node) || isMapping(node);
   }

   protected checkUniqueNodeId(node: AstNode, accept: ValidationAcceptor): void {
      if (isSystemDiagram(node)) {
         this.markDuplicateIds(node.edges, accept);
         this.markDuplicateIds(node.nodes, accept);
      }
      if (isMapping(node)) {
         this.markDuplicateIds(node.sources, accept);
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

   checkRelationship(relationship: Relationship, accept: ValidationAcceptor): void {
      // we check that each attribute actually belongs to their respective entity (parent, child)
      // and that each attribute is only used once
      const usedParentAttributes: Attribute[] = [];
      const usedChildAttributes: Attribute[] = [];
      for (const attribute of relationship.attributes) {
         if (attribute.parent.ref) {
            if (attribute.parent?.ref?.$container !== relationship.parent?.ref) {
               accept('error', 'Not a valid parent attribute.', { node: attribute, property: 'parent' });
            } else if (usedParentAttributes.includes(attribute.parent.ref)) {
               accept('error', 'Each parent attribute can only be referenced once.', { node: attribute, property: 'parent' });
            } else {
               usedParentAttributes.push(attribute.parent.ref);
            }
         }
         if (attribute.child.ref) {
            if (attribute.child?.ref?.$container !== relationship.child?.ref) {
               accept('error', 'Not a valid child attribute.', { node: attribute, property: 'child' });
            } else if (usedChildAttributes.includes(attribute.child.ref)) {
               accept('error', 'Each child attribute can only be referenced once.', { node: attribute, property: 'child' });
            } else {
               usedChildAttributes.push(attribute.child.ref);
            }
         }
      }
   }

   checkRelationshipEdge(edge: RelationshipEdge, accept: ValidationAcceptor): void {
      if (edge.sourceNode?.ref?.entity?.ref?.$type !== edge.relationship?.ref?.parent?.ref?.$type) {
         accept('error', 'Source must match type of parent.', { node: edge, property: 'sourceNode' });
      }
      if (edge.targetNode?.ref?.entity?.ref?.$type !== edge.relationship?.ref?.child?.ref?.$type) {
         accept('error', 'Target must match type of child.', { node: edge, property: 'targetNode' });
      }
   }

   checkSourceObject(obj: SourceObject, accept: ValidationAcceptor): void {
      if (obj.join === 'from' && obj.dependencies.length > 0) {
         accept('error', 'Source objects with join type "from" cannot have dependencies.', { node: obj, property: 'dependencies' });
      }
      const knownRefs: string[] = [];
      for (const dependency of obj.dependencies) {
         if (knownRefs.includes(dependency.source.$refText)) {
            accept('warning', 'Avoid duplicate dependency entries.', { node: dependency });
         } else if (dependency.source.$refText) {
            knownRefs.push(dependency.source.$refText);
         }
      }
   }

   checkAttributeMapping(mapping: AttributeMapping, accept: ValidationAcceptor): void {
      const mappingExpression = findNodeForProperty(mapping.$cstNode, 'expression');
      if (!mappingExpression) {
         return;
      }
      const mappingExpressionRange = mappingExpression.range;
      const expressions = findAllExpressions(mapping.expression);
      const sources = mapping.sources.map(source => source.value.$refText);
      for (const expression of expressions) {
         const completeExpression = getExpression(expression);
         const expressionPosition = getExpressionPosition(expression);
         const expressionText = getExpressionText(expression);
         if (!sources.includes(expressionText)) {
            const startCharacter = mappingExpressionRange.start.character + expressionPosition + 1;
            accept('error', 'Only sources can be referenced in an expression.', {
               node: mapping,
               range: {
                  start: { line: mappingExpressionRange.start.line, character: startCharacter },
                  end: { line: mappingExpressionRange.end.line, character: startCharacter + completeExpression.length }
               }
            });
         }
      }
   }

   checkTargetObject(target: TargetObject, accept: ValidationAcceptor): void {
      const knownAttributes: TargetObjectAttribute[] = [];
      for (const mapping of target.mappings) {
         if (mapping.attribute.value.ref && knownAttributes.includes(mapping.attribute.value.ref)) {
            accept('error', 'Each target attribute can only be mapped once.', { node: mapping.attribute });
         } else if (mapping.attribute.value.ref) {
            knownAttributes.push(mapping.attribute.value.ref);
         }
      }
   }

   checkMapping(mapping: Mapping, accept: ValidationAcceptor): void {
      let hasJoinSourceObject = false;
      for (const sourceObject of mapping.sources) {
         if (sourceObject.join === 'from') {
            if (!hasJoinSourceObject) {
               hasJoinSourceObject = true;
            } else {
               accept('error', 'Only one source object with join type "from" is allowed per mapping.', {
                  node: sourceObject,
                  property: 'join'
               });
            }
         }
      }
   }

   checkSourceObjectDependency(dependency: SourceObjectDependency, accept: ValidationAcceptor): void {
      if (dependency.source.ref && dependency.source.ref === dependency.$container) {
         accept('error', 'Cannot reference yourself as dependency.', { node: dependency });
      }
      if (dependency.source.ref && findDocument(dependency.source.ref)?.uri.toString() !== findDocument(dependency)?.uri.toString()) {
         accept('error', 'Can only reference source objects from the same mapping.', { node: dependency });
      }
   }

   checkSourceObjectCondition(condition: SourceObjectCondition, accept: ValidationAcceptor): void {
      const sourceObject = condition.$container;
      const left = condition.expression.left;
      const checkReference: (reference: Reference<SourceObjectAttribute>) => boolean = reference => {
         if (!reference.ref) {
            return true;
         }
         const referencedSourceObject = getOwner(reference.ref);
         return (
            referencedSourceObject === sourceObject ||
            !!sourceObject.dependencies.find(dependency => dependency.source.ref === referencedSourceObject)
         );
      };
      if (left.$type === 'SourceObjectAttributeReference' && !checkReference(left.value)) {
         accept('error', 'Can only reference attributes from source objects that are listed as dependency.', { node: left });
      }
      const right = condition.expression.right;
      if (right.$type === 'SourceObjectAttributeReference' && !checkReference(right.value)) {
         accept('error', 'Can only reference attributes from source objects that are listed as dependency.', { node: right });
      }
   }
}
