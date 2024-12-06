/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AttributeMappingSourceType } from '@crossbreeze/protocol';
import { AstNode, AstNodeDescription, AstUtils, LangiumDocument, isAstNode, isAstNodeDescription } from 'langium';
import { ID_PROPERTY, IdProvider } from '../cross-model-naming.js';
import { getLocalName } from '../cross-model-scope.js';
import {
   Attribute,
   AttributeMapping,
   AttributeMappingSource,
   AttributeMappingTarget,
   CrossModelRoot,
   Entity,
   EntityNode,
   EntityNodeAttribute,
   Mapping,
   Relationship,
   SourceObject,
   SourceObjectAttribute,
   SystemDiagram,
   TargetObject,
   TargetObjectAttribute,
   isCrossModelRoot,
   isEntity,
   isMapping,
   isRelationship,
   isSystemDiagram
} from '../generated/ast.js';

export type SemanticRoot = Entity | Mapping | Relationship | SystemDiagram;

export const IMPLICIT_ATTRIBUTES_PROPERTY = '$attributes';
export const IMPLICIT_OWNER_PROPERTY = '$owner';
export const IMPLICIT_ID_PROPERTY = '$id';

export function getAttributes(node: EntityNode): EntityNodeAttribute[];
export function getAttributes(node: SourceObject): SourceObjectAttribute[];
export function getAttributes(node: TargetObject): TargetObjectAttribute[];
export function getAttributes<T>(node: any): T[] {
   return (node[IMPLICIT_ATTRIBUTES_PROPERTY] as T[]) ?? [];
}

export function setAttributes(node: EntityNode, attributes: EntityNodeAttribute[]): void;
export function setAttributes(node: SourceObject, attributes: SourceObjectAttribute[]): void;
export function setAttributes(node: TargetObject, attributes: TargetObjectAttribute[]): void;
export function setAttributes(node: object, attributes: Attribute[]): void {
   (node as any)[IMPLICIT_ATTRIBUTES_PROPERTY] = attributes;
}

export function getOwner(node: EntityNodeAttribute): EntityNode;
export function getOwner(node: SourceObjectAttribute): SourceObject;
export function getOwner(node: TargetObjectAttribute): TargetObject;
export function getOwner(node?: AstNode): AstNode | undefined;
export function getOwner<T>(node: any): T | undefined {
   return node?.[IMPLICIT_OWNER_PROPERTY] as T;
}

export function setOwner(attribute: EntityNodeAttribute, owner: EntityNode): EntityNodeAttribute;
export function setOwner(attribute: SourceObjectAttribute, owner: SourceObject): SourceObjectAttribute;
export function setOwner(attribute: TargetObjectAttribute, owner: TargetObject): TargetObjectAttribute;
export function setOwner<T>(attribute: T, owner: object): T {
   (attribute as any)[IMPLICIT_OWNER_PROPERTY] = owner;
   return attribute;
}

export function setImplicitId(node: any, id: string): void {
   node[ID_PROPERTY] = id;
   node[IMPLICIT_ID_PROPERTY] = true;
}

export function removeImplicitProperties(node: any): void {
   delete node[IMPLICIT_ATTRIBUTES_PROPERTY];
   delete node[IMPLICIT_OWNER_PROPERTY];
   if (node[IMPLICIT_ID_PROPERTY] === true) {
      delete node[ID_PROPERTY];
      delete node[IMPLICIT_ID_PROPERTY];
   }
}

export function isImplicitProperty(prop: string, obj: any): boolean {
   return (
      prop === IMPLICIT_ATTRIBUTES_PROPERTY ||
      prop === IMPLICIT_OWNER_PROPERTY ||
      prop === IMPLICIT_ID_PROPERTY ||
      (obj[IMPLICIT_ID_PROPERTY] === true && prop === ID_PROPERTY)
   );
}

export function createSourceObject(entity: Entity | AstNodeDescription, container: Mapping, idProvider: IdProvider): SourceObject {
   const entityId = isAstNodeDescription(entity)
      ? getLocalName(entity)
      : entity.id ?? idProvider.getLocalId(entity) ?? entity.name ?? 'unknown';
   const ref = isAstNodeDescription(entity) ? undefined : entity;
   const $refText = isAstNodeDescription(entity) ? entity.name : idProvider.getGlobalId(entity) || entity.id || '';
   return {
      $type: SourceObject,
      $container: container,
      id: idProvider.findNextId(SourceObject, entityId + 'SourceObject', container),
      entity: { $refText, ref },
      join: 'from',
      dependencies: [],
      conditions: [],
      customProperties: []
   };
}

export function createAttributeMapping(container: TargetObject, source: string | undefined, targetId: string): AttributeMapping {
   const mapping = {
      $type: AttributeMapping,
      $container: container
   } as AttributeMapping;
   mapping.sources = source ? [createAttributeMappingSource(mapping, source)] : [];
   mapping.attribute = createAttributeMappingTarget(mapping, targetId);
   return mapping;
}

export function createAttributeMappingSource(container: AttributeMapping, sourceId: string): AttributeMappingSource {
   return {
      $container: container,
      $type: AttributeMappingSourceType,
      value: { $refText: sourceId }
   };
}

export function createAttributeMappingTarget(container: AttributeMapping, targetId: string): AttributeMappingTarget {
   return {
      $container: container,
      $type: AttributeMappingTarget,
      value: { $refText: targetId }
   };
}

/**
 * Retrieve the document in which the given AST node is contained. A reference to the document is
 * usually held by the root node of the AST.
 */
export function findDocument<T extends AstNode = AstNode>(node?: AstNode): LangiumDocument<T> | undefined {
   if (!node) {
      return undefined;
   }
   const rootNode = AstUtils.findRootNode(node);
   const result = rootNode.$document;
   return result ? <LangiumDocument<T>>result : undefined;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function fixDocument<T extends AstNode = AstNode, R extends AstNode = AstNode>(
   node: undefined,
   document: LangiumDocument<R> | undefined
): undefined;
export function fixDocument<T extends AstNode = AstNode, R extends AstNode = AstNode>(node: T, document: LangiumDocument<R> | undefined): T;
export function fixDocument<T extends AstNode = AstNode, R extends AstNode = AstNode>(
   node: T | undefined,
   document: LangiumDocument<R> | undefined
): T | undefined;
export function fixDocument<T extends AstNode = AstNode, R extends AstNode = AstNode>(
   node: T | undefined,
   document: LangiumDocument<R> | undefined
): T | undefined {
   if (!node || !document) {
      return node;
   }
   const rootNode = AstUtils.findRootNode(node);
   if (!rootNode.$document) {
      (rootNode as any).$document = document;
   }
   return node;
}

export type WithDocument<T> = T & { $document: LangiumDocument<CrossModelRoot> };
export type DocumentContent = LangiumDocument | AstNode;
export type TypeGuard<T> = (item: unknown) => item is T;

export function isSemanticRoot(element: unknown): element is SemanticRoot {
   return isEntity(element) || isMapping(element) || isRelationship(element) || isSystemDiagram(element);
}

export function findSemanticRoot(input: DocumentContent): SemanticRoot | undefined;
export function findSemanticRoot<T extends SemanticRoot>(input: DocumentContent, guard: TypeGuard<T>): T | undefined;
export function findSemanticRoot<T extends SemanticRoot>(input: DocumentContent, guard?: TypeGuard<T>): SemanticRoot | T | undefined {
   const root = isAstNode(input) ? input.$document?.parseResult?.value ?? AstUtils.findRootNode(input) : input.parseResult?.value;
   const semanticRoot = isCrossModelRoot(root) ? root.entity ?? root.mapping ?? root.relationship ?? root.systemDiagram : undefined;
   return !semanticRoot ? undefined : !guard ? semanticRoot : guard(semanticRoot) ? semanticRoot : undefined;
}

export function findEntity(input: DocumentContent): Entity | undefined {
   return findSemanticRoot(input, isEntity);
}

export function findRelationship(input: DocumentContent): Relationship | undefined {
   return findSemanticRoot(input, isRelationship);
}

export function findSystemDiagram(input: DocumentContent): SystemDiagram | undefined {
   return findSemanticRoot(input, isSystemDiagram);
}

export function findMapping(input: DocumentContent): Mapping | undefined {
   return findSemanticRoot(input, isMapping);
}

export function hasSemanticRoot<T extends SemanticRoot>(document: LangiumDocument<any>, guard: (item: unknown) => item is T): boolean {
   return guard(findSemanticRoot(document));
}
