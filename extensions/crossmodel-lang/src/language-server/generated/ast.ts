/******************************************************************************
 * This file was generated by langium-cli 3.3.0.
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

/* eslint-disable */
import type { AstNode, Reference, ReferenceInfo, TypeMetaData } from 'langium';
import { AbstractAstReflection } from 'langium';

export const CrossModelTerminals = {
    STRING: /"[^"]*"|'[^']*'/,
    NUMBER: /(-)?[0-9]+(\.[0-9]+)?/,
    ID: /[_a-zA-Z][\w_\-~$#@/\d]*/,
    SL_COMMENT: /#[^\n\r]*/,
    INDENT: /:synthetic-indent:/,
    DEDENT: /:synthetic-dedent:/,
    LIST_ITEM: /- /,
    NEWLINE: /[/\r\n|\r|\n/]+/,
    WS: /[ \t]+/,
};

export type CrossModelTerminalNames = keyof typeof CrossModelTerminals;

export type CrossModelKeywordNames = 
    | "!="
    | "."
    | "0"
    | "1"
    | ":"
    | "<"
    | "<="
    | "="
    | ">"
    | ">="
    | "TRUE"
    | "apply"
    | "attribute"
    | "attributes"
    | "child"
    | "childCardinality"
    | "childRole"
    | "conditions"
    | "cross-join"
    | "customProperties"
    | "datatype"
    | "dependencies"
    | "description"
    | "diagram"
    | "edges"
    | "entity"
    | "expression"
    | "from"
    | "height"
    | "id"
    | "identifier"
    | "inherits"
    | "inner-join"
    | "join"
    | "left-join"
    | "length"
    | "mapping"
    | "mappings"
    | "n"
    | "name"
    | "nodes"
    | "parent"
    | "parentCardinality"
    | "parentRole"
    | "precision"
    | "relationship"
    | "scale"
    | "sourceNode"
    | "sources"
    | "systemDiagram"
    | "target"
    | "targetNode"
    | "true"
    | "value"
    | "width"
    | "x"
    | "y";

export type CrossModelTokenNames = CrossModelTerminalNames | CrossModelKeywordNames;

export type BooleanExpression = NumberLiteral | SourceObjectAttributeReference | StringLiteral;

export const BooleanExpression = 'BooleanExpression';

export function isBooleanExpression(item: unknown): item is BooleanExpression {
    return reflection.isInstance(item, BooleanExpression);
}

export type Cardinality = '0' | '1' | 'n';

export function isCardinality(item: unknown): item is Cardinality {
    return item === '0' || item === '1' || item === 'n';
}

export type IDReference = string;

export function isIDReference(item: unknown): item is IDReference {
    return typeof item === 'string';
}

export type JoinType = 'apply' | 'cross-join' | 'from' | 'inner-join' | 'left-join';

export function isJoinType(item: unknown): item is JoinType {
    return item === 'from' || item === 'inner-join' || item === 'cross-join' || item === 'left-join' || item === 'apply';
}

export type SourceObjectCondition = JoinCondition;

export const SourceObjectCondition = 'SourceObjectCondition';

export function isSourceObjectCondition(item: unknown): item is SourceObjectCondition {
    return reflection.isInstance(item, SourceObjectCondition);
}

export interface AttributeMappingSource extends AstNode {
    readonly $container: AttributeMapping;
    readonly $type: 'AttributeMappingSource';
    value: Reference<SourceObjectAttribute>;
}

export const AttributeMappingSource = 'AttributeMappingSource';

export function isAttributeMappingSource(item: unknown): item is AttributeMappingSource {
    return reflection.isInstance(item, AttributeMappingSource);
}

export interface AttributeMappingTarget extends AstNode {
    readonly $container: AttributeMapping;
    readonly $type: 'AttributeMappingTarget';
    value: Reference<TargetObjectAttribute>;
}

export const AttributeMappingTarget = 'AttributeMappingTarget';

export function isAttributeMappingTarget(item: unknown): item is AttributeMappingTarget {
    return reflection.isInstance(item, AttributeMappingTarget);
}

export interface BinaryExpression extends AstNode {
    readonly $container: JoinCondition;
    readonly $type: 'BinaryExpression';
    left: BooleanExpression;
    op: '!=' | '<' | '<=' | '=' | '>' | '>=';
    right: BooleanExpression;
}

export const BinaryExpression = 'BinaryExpression';

export function isBinaryExpression(item: unknown): item is BinaryExpression {
    return reflection.isInstance(item, BinaryExpression);
}

export interface CrossModelRoot extends AstNode {
    readonly $type: 'CrossModelRoot';
    entity?: Entity;
    mapping?: Mapping;
    relationship?: Relationship;
    systemDiagram?: SystemDiagram;
}

export const CrossModelRoot = 'CrossModelRoot';

export function isCrossModelRoot(item: unknown): item is CrossModelRoot {
    return reflection.isInstance(item, CrossModelRoot);
}

export interface CustomProperty extends AstNode {
    readonly $container: WithCustomProperties;
    readonly $type: 'CustomProperty';
    name: string;
    value?: string;
}

export const CustomProperty = 'CustomProperty';

export function isCustomProperty(item: unknown): item is CustomProperty {
    return reflection.isInstance(item, CustomProperty);
}

export interface IdentifiedObject extends AstNode {
    readonly $type: 'DataElement' | 'DataElementContainer' | 'DataElementContainerLink' | 'DataElementContainerMapping' | 'DataElementMapping' | 'Entity' | 'EntityAttribute' | 'EntityNode' | 'EntityNodeAttribute' | 'IdentifiedObject' | 'Mapping' | 'NamedObject' | 'Relationship' | 'RelationshipEdge' | 'SourceDataElementContainer' | 'SourceObject' | 'SourceObjectAttribute' | 'SystemDiagram' | 'TargetObjectAttribute';
    id: string;
}

export const IdentifiedObject = 'IdentifiedObject';

export function isIdentifiedObject(item: unknown): item is IdentifiedObject {
    return reflection.isInstance(item, IdentifiedObject);
}

export interface JoinCondition extends AstNode {
    readonly $container: SourceObject;
    readonly $type: 'JoinCondition';
    expression: BinaryExpression;
}

export const JoinCondition = 'JoinCondition';

export function isJoinCondition(item: unknown): item is JoinCondition {
    return reflection.isInstance(item, JoinCondition);
}

export interface NumberLiteral extends AstNode {
    readonly $container: BinaryExpression;
    readonly $type: 'NumberLiteral';
    value: number;
}

export const NumberLiteral = 'NumberLiteral';

export function isNumberLiteral(item: unknown): item is NumberLiteral {
    return reflection.isInstance(item, NumberLiteral);
}

export interface SourceObjectAttributeReference extends AstNode {
    readonly $container: BinaryExpression;
    readonly $type: 'SourceObjectAttributeReference';
    value: Reference<SourceObjectAttribute>;
}

export const SourceObjectAttributeReference = 'SourceObjectAttributeReference';

export function isSourceObjectAttributeReference(item: unknown): item is SourceObjectAttributeReference {
    return reflection.isInstance(item, SourceObjectAttributeReference);
}

export interface SourceObjectDependency extends AstNode {
    readonly $container: SourceObject;
    readonly $type: 'SourceObjectDependency';
    source: Reference<SourceObject>;
}

export const SourceObjectDependency = 'SourceObjectDependency';

export function isSourceObjectDependency(item: unknown): item is SourceObjectDependency {
    return reflection.isInstance(item, SourceObjectDependency);
}

export interface StringLiteral extends AstNode {
    readonly $container: BinaryExpression;
    readonly $type: 'StringLiteral';
    value: string;
}

export const StringLiteral = 'StringLiteral';

export function isStringLiteral(item: unknown): item is StringLiteral {
    return reflection.isInstance(item, StringLiteral);
}

export interface WithCustomProperties extends AstNode {
    readonly $type: 'AttributeMapping' | 'Entity' | 'EntityAttribute' | 'EntityNodeAttribute' | 'Mapping' | 'Relationship' | 'RelationshipAttribute' | 'SourceObject' | 'SourceObjectAttribute' | 'TargetObject' | 'TargetObjectAttribute' | 'WithCustomProperties';
    customProperties: Array<CustomProperty>;
}

export const WithCustomProperties = 'WithCustomProperties';

export function isWithCustomProperties(item: unknown): item is WithCustomProperties {
    return reflection.isInstance(item, WithCustomProperties);
}

export interface DataElementContainerMapping extends IdentifiedObject {
    readonly $container: CrossModelRoot;
    readonly $type: 'DataElementContainerMapping' | 'Mapping';
}

export const DataElementContainerMapping = 'DataElementContainerMapping';

export function isDataElementContainerMapping(item: unknown): item is DataElementContainerMapping {
    return reflection.isInstance(item, DataElementContainerMapping);
}

export interface DataElementMapping extends IdentifiedObject {
    readonly $type: 'DataElementMapping';
}

export const DataElementMapping = 'DataElementMapping';

export function isDataElementMapping(item: unknown): item is DataElementMapping {
    return reflection.isInstance(item, DataElementMapping);
}

export interface EntityNode extends IdentifiedObject {
    readonly $container: SystemDiagram;
    readonly $type: 'EntityNode';
    entity: Reference<Entity>;
    height: number;
    width: number;
    x: number;
    y: number;
}

export const EntityNode = 'EntityNode';

export function isEntityNode(item: unknown): item is EntityNode {
    return reflection.isInstance(item, EntityNode);
}

export interface NamedObject extends IdentifiedObject {
    readonly $type: 'DataElement' | 'DataElementContainer' | 'DataElementContainerLink' | 'Entity' | 'EntityAttribute' | 'EntityNodeAttribute' | 'NamedObject' | 'Relationship' | 'SourceObjectAttribute' | 'TargetObjectAttribute';
    description?: string;
    name: string;
}

export const NamedObject = 'NamedObject';

export function isNamedObject(item: unknown): item is NamedObject {
    return reflection.isInstance(item, NamedObject);
}

export interface RelationshipEdge extends IdentifiedObject {
    readonly $container: SystemDiagram;
    readonly $type: 'RelationshipEdge';
    relationship: Reference<Relationship>;
    sourceNode: Reference<EntityNode>;
    targetNode: Reference<EntityNode>;
}

export const RelationshipEdge = 'RelationshipEdge';

export function isRelationshipEdge(item: unknown): item is RelationshipEdge {
    return reflection.isInstance(item, RelationshipEdge);
}

export interface SourceDataElementContainer extends IdentifiedObject {
    readonly $container: Mapping;
    readonly $type: 'SourceDataElementContainer' | 'SourceObject';
}

export const SourceDataElementContainer = 'SourceDataElementContainer';

export function isSourceDataElementContainer(item: unknown): item is SourceDataElementContainer {
    return reflection.isInstance(item, SourceDataElementContainer);
}

export interface SystemDiagram extends IdentifiedObject {
    readonly $container: CrossModelRoot;
    readonly $type: 'SystemDiagram';
    edges: Array<RelationshipEdge>;
    nodes: Array<EntityNode>;
}

export const SystemDiagram = 'SystemDiagram';

export function isSystemDiagram(item: unknown): item is SystemDiagram {
    return reflection.isInstance(item, SystemDiagram);
}

export interface AttributeMapping extends WithCustomProperties {
    readonly $container: TargetObject;
    readonly $type: 'AttributeMapping';
    attribute: AttributeMappingTarget;
    expression: string;
    sources: Array<AttributeMappingSource>;
}

export const AttributeMapping = 'AttributeMapping';

export function isAttributeMapping(item: unknown): item is AttributeMapping {
    return reflection.isInstance(item, AttributeMapping);
}

export interface Entity extends DataElementContainer, WithCustomProperties {
    readonly $container: CrossModelRoot;
    readonly $type: 'Entity';
    attributes: Array<EntityAttribute>;
    superEntities: Array<Reference<Entity>>;
}

export const Entity = 'Entity';

export function isEntity(item: unknown): item is Entity {
    return reflection.isInstance(item, Entity);
}

export interface EntityAttribute extends DataElement, WithCustomProperties {
    readonly $type: 'EntityAttribute' | 'EntityNodeAttribute' | 'SourceObjectAttribute' | 'TargetObjectAttribute';
    identifier: boolean;
    length?: number;
    precision?: number;
    scale?: number;
}

export const EntityAttribute = 'EntityAttribute';

export function isEntityAttribute(item: unknown): item is EntityAttribute {
    return reflection.isInstance(item, EntityAttribute);
}

export interface Mapping extends DataElementContainerMapping, WithCustomProperties {
    readonly $container: CrossModelRoot;
    readonly $type: 'Mapping';
    sources: Array<SourceObject>;
    target: TargetObject;
}

export const Mapping = 'Mapping';

export function isMapping(item: unknown): item is Mapping {
    return reflection.isInstance(item, Mapping);
}

export interface Relationship extends DataElementContainerLink, WithCustomProperties {
    readonly $container: CrossModelRoot;
    readonly $type: 'Relationship';
    attributes: Array<RelationshipAttribute>;
    child: Reference<Entity>;
    childCardinality?: string;
    childRole?: string;
    parent: Reference<Entity>;
    parentCardinality?: string;
    parentRole?: string;
}

export const Relationship = 'Relationship';

export function isRelationship(item: unknown): item is Relationship {
    return reflection.isInstance(item, Relationship);
}

export interface RelationshipAttribute extends WithCustomProperties {
    readonly $container: Relationship;
    readonly $type: 'RelationshipAttribute';
    child: Reference<EntityAttribute>;
    parent: Reference<EntityAttribute>;
}

export const RelationshipAttribute = 'RelationshipAttribute';

export function isRelationshipAttribute(item: unknown): item is RelationshipAttribute {
    return reflection.isInstance(item, RelationshipAttribute);
}

export interface SourceObject extends SourceDataElementContainer, WithCustomProperties {
    readonly $container: Mapping;
    readonly $type: 'SourceObject';
    conditions: Array<SourceObjectCondition>;
    dependencies: Array<SourceObjectDependency>;
    entity: Reference<Entity>;
    join: string;
}

export const SourceObject = 'SourceObject';

export function isSourceObject(item: unknown): item is SourceObject {
    return reflection.isInstance(item, SourceObject);
}

export interface TargetObject extends WithCustomProperties {
    readonly $container: Mapping;
    readonly $type: 'TargetObject';
    entity: Reference<Entity>;
    mappings: Array<AttributeMapping>;
}

export const TargetObject = 'TargetObject';

export function isTargetObject(item: unknown): item is TargetObject {
    return reflection.isInstance(item, TargetObject);
}

export interface DataElement extends NamedObject {
    readonly $type: 'DataElement' | 'EntityAttribute' | 'EntityNodeAttribute' | 'SourceObjectAttribute' | 'TargetObjectAttribute';
    datatype?: string;
}

export const DataElement = 'DataElement';

export function isDataElement(item: unknown): item is DataElement {
    return reflection.isInstance(item, DataElement);
}

export interface DataElementContainer extends NamedObject {
    readonly $container: CrossModelRoot;
    readonly $type: 'DataElementContainer' | 'Entity';
}

export const DataElementContainer = 'DataElementContainer';

export function isDataElementContainer(item: unknown): item is DataElementContainer {
    return reflection.isInstance(item, DataElementContainer);
}

export interface DataElementContainerLink extends NamedObject {
    readonly $container: CrossModelRoot;
    readonly $type: 'DataElementContainerLink' | 'Relationship';
}

export const DataElementContainerLink = 'DataElementContainerLink';

export function isDataElementContainerLink(item: unknown): item is DataElementContainerLink {
    return reflection.isInstance(item, DataElementContainerLink);
}

export interface EntityNodeAttribute extends EntityAttribute {
    readonly $type: 'EntityNodeAttribute';
}

export const EntityNodeAttribute = 'EntityNodeAttribute';

export function isEntityNodeAttribute(item: unknown): item is EntityNodeAttribute {
    return reflection.isInstance(item, EntityNodeAttribute);
}

export interface SourceObjectAttribute extends EntityAttribute {
    readonly $type: 'SourceObjectAttribute';
}

export const SourceObjectAttribute = 'SourceObjectAttribute';

export function isSourceObjectAttribute(item: unknown): item is SourceObjectAttribute {
    return reflection.isInstance(item, SourceObjectAttribute);
}

export interface TargetObjectAttribute extends EntityAttribute {
    readonly $type: 'TargetObjectAttribute';
}

export const TargetObjectAttribute = 'TargetObjectAttribute';

export function isTargetObjectAttribute(item: unknown): item is TargetObjectAttribute {
    return reflection.isInstance(item, TargetObjectAttribute);
}

export type CrossModelAstType = {
    AttributeMapping: AttributeMapping
    AttributeMappingSource: AttributeMappingSource
    AttributeMappingTarget: AttributeMappingTarget
    BinaryExpression: BinaryExpression
    BooleanExpression: BooleanExpression
    CrossModelRoot: CrossModelRoot
    CustomProperty: CustomProperty
    DataElement: DataElement
    DataElementContainer: DataElementContainer
    DataElementContainerLink: DataElementContainerLink
    DataElementContainerMapping: DataElementContainerMapping
    DataElementMapping: DataElementMapping
    Entity: Entity
    EntityAttribute: EntityAttribute
    EntityNode: EntityNode
    EntityNodeAttribute: EntityNodeAttribute
    IdentifiedObject: IdentifiedObject
    JoinCondition: JoinCondition
    Mapping: Mapping
    NamedObject: NamedObject
    NumberLiteral: NumberLiteral
    Relationship: Relationship
    RelationshipAttribute: RelationshipAttribute
    RelationshipEdge: RelationshipEdge
    SourceDataElementContainer: SourceDataElementContainer
    SourceObject: SourceObject
    SourceObjectAttribute: SourceObjectAttribute
    SourceObjectAttributeReference: SourceObjectAttributeReference
    SourceObjectCondition: SourceObjectCondition
    SourceObjectDependency: SourceObjectDependency
    StringLiteral: StringLiteral
    SystemDiagram: SystemDiagram
    TargetObject: TargetObject
    TargetObjectAttribute: TargetObjectAttribute
    WithCustomProperties: WithCustomProperties
}

export class CrossModelAstReflection extends AbstractAstReflection {

    getAllTypes(): string[] {
        return [AttributeMapping, AttributeMappingSource, AttributeMappingTarget, BinaryExpression, BooleanExpression, CrossModelRoot, CustomProperty, DataElement, DataElementContainer, DataElementContainerLink, DataElementContainerMapping, DataElementMapping, Entity, EntityAttribute, EntityNode, EntityNodeAttribute, IdentifiedObject, JoinCondition, Mapping, NamedObject, NumberLiteral, Relationship, RelationshipAttribute, RelationshipEdge, SourceDataElementContainer, SourceObject, SourceObjectAttribute, SourceObjectAttributeReference, SourceObjectCondition, SourceObjectDependency, StringLiteral, SystemDiagram, TargetObject, TargetObjectAttribute, WithCustomProperties];
    }

    protected override computeIsSubtype(subtype: string, supertype: string): boolean {
        switch (subtype) {
            case AttributeMapping:
            case RelationshipAttribute:
            case TargetObject: {
                return this.isSubtype(WithCustomProperties, supertype);
            }
            case DataElement:
            case DataElementContainer:
            case DataElementContainerLink: {
                return this.isSubtype(NamedObject, supertype);
            }
            case DataElementContainerMapping:
            case DataElementMapping:
            case EntityNode:
            case NamedObject:
            case RelationshipEdge:
            case SourceDataElementContainer:
            case SystemDiagram: {
                return this.isSubtype(IdentifiedObject, supertype);
            }
            case Entity: {
                return this.isSubtype(DataElementContainer, supertype) || this.isSubtype(WithCustomProperties, supertype);
            }
            case EntityAttribute: {
                return this.isSubtype(DataElement, supertype) || this.isSubtype(WithCustomProperties, supertype);
            }
            case EntityNodeAttribute:
            case SourceObjectAttribute:
            case TargetObjectAttribute: {
                return this.isSubtype(EntityAttribute, supertype);
            }
            case JoinCondition: {
                return this.isSubtype(SourceObjectCondition, supertype);
            }
            case Mapping: {
                return this.isSubtype(DataElementContainerMapping, supertype) || this.isSubtype(WithCustomProperties, supertype);
            }
            case NumberLiteral:
            case SourceObjectAttributeReference:
            case StringLiteral: {
                return this.isSubtype(BooleanExpression, supertype);
            }
            case Relationship: {
                return this.isSubtype(DataElementContainerLink, supertype) || this.isSubtype(WithCustomProperties, supertype);
            }
            case SourceObject: {
                return this.isSubtype(SourceDataElementContainer, supertype) || this.isSubtype(WithCustomProperties, supertype);
            }
            default: {
                return false;
            }
        }
    }

    getReferenceType(refInfo: ReferenceInfo): string {
        const referenceId = `${refInfo.container.$type}:${refInfo.property}`;
        switch (referenceId) {
            case 'AttributeMappingSource:value':
            case 'SourceObjectAttributeReference:value': {
                return SourceObjectAttribute;
            }
            case 'AttributeMappingTarget:value': {
                return TargetObjectAttribute;
            }
            case 'Entity:superEntities':
            case 'EntityNode:entity':
            case 'Relationship:child':
            case 'Relationship:parent':
            case 'SourceObject:entity':
            case 'TargetObject:entity': {
                return Entity;
            }
            case 'RelationshipAttribute:child':
            case 'RelationshipAttribute:parent': {
                return EntityAttribute;
            }
            case 'RelationshipEdge:relationship': {
                return Relationship;
            }
            case 'RelationshipEdge:sourceNode':
            case 'RelationshipEdge:targetNode': {
                return EntityNode;
            }
            case 'SourceObjectDependency:source': {
                return SourceObject;
            }
            default: {
                throw new Error(`${referenceId} is not a valid reference id.`);
            }
        }
    }

    getTypeMetaData(type: string): TypeMetaData {
        switch (type) {
            case AttributeMappingSource: {
                return {
                    name: AttributeMappingSource,
                    properties: [
                        { name: 'value' }
                    ]
                };
            }
            case AttributeMappingTarget: {
                return {
                    name: AttributeMappingTarget,
                    properties: [
                        { name: 'value' }
                    ]
                };
            }
            case BinaryExpression: {
                return {
                    name: BinaryExpression,
                    properties: [
                        { name: 'left' },
                        { name: 'op' },
                        { name: 'right' }
                    ]
                };
            }
            case CrossModelRoot: {
                return {
                    name: CrossModelRoot,
                    properties: [
                        { name: 'entity' },
                        { name: 'mapping' },
                        { name: 'relationship' },
                        { name: 'systemDiagram' }
                    ]
                };
            }
            case CustomProperty: {
                return {
                    name: CustomProperty,
                    properties: [
                        { name: 'name' },
                        { name: 'value' }
                    ]
                };
            }
            case IdentifiedObject: {
                return {
                    name: IdentifiedObject,
                    properties: [
                        { name: 'id' }
                    ]
                };
            }
            case JoinCondition: {
                return {
                    name: JoinCondition,
                    properties: [
                        { name: 'expression' }
                    ]
                };
            }
            case NumberLiteral: {
                return {
                    name: NumberLiteral,
                    properties: [
                        { name: 'value' }
                    ]
                };
            }
            case SourceObjectAttributeReference: {
                return {
                    name: SourceObjectAttributeReference,
                    properties: [
                        { name: 'value' }
                    ]
                };
            }
            case SourceObjectDependency: {
                return {
                    name: SourceObjectDependency,
                    properties: [
                        { name: 'source' }
                    ]
                };
            }
            case StringLiteral: {
                return {
                    name: StringLiteral,
                    properties: [
                        { name: 'value' }
                    ]
                };
            }
            case WithCustomProperties: {
                return {
                    name: WithCustomProperties,
                    properties: [
                        { name: 'customProperties', defaultValue: [] }
                    ]
                };
            }
            case DataElementContainerMapping: {
                return {
                    name: DataElementContainerMapping,
                    properties: [
                        { name: 'id' }
                    ]
                };
            }
            case DataElementMapping: {
                return {
                    name: DataElementMapping,
                    properties: [
                        { name: 'id' }
                    ]
                };
            }
            case EntityNode: {
                return {
                    name: EntityNode,
                    properties: [
                        { name: 'entity' },
                        { name: 'height' },
                        { name: 'id' },
                        { name: 'width' },
                        { name: 'x' },
                        { name: 'y' }
                    ]
                };
            }
            case NamedObject: {
                return {
                    name: NamedObject,
                    properties: [
                        { name: 'description' },
                        { name: 'id' },
                        { name: 'name' }
                    ]
                };
            }
            case RelationshipEdge: {
                return {
                    name: RelationshipEdge,
                    properties: [
                        { name: 'id' },
                        { name: 'relationship' },
                        { name: 'sourceNode' },
                        { name: 'targetNode' }
                    ]
                };
            }
            case SourceDataElementContainer: {
                return {
                    name: SourceDataElementContainer,
                    properties: [
                        { name: 'id' }
                    ]
                };
            }
            case SystemDiagram: {
                return {
                    name: SystemDiagram,
                    properties: [
                        { name: 'edges', defaultValue: [] },
                        { name: 'id' },
                        { name: 'nodes', defaultValue: [] }
                    ]
                };
            }
            case AttributeMapping: {
                return {
                    name: AttributeMapping,
                    properties: [
                        { name: 'attribute' },
                        { name: 'customProperties', defaultValue: [] },
                        { name: 'expression' },
                        { name: 'sources', defaultValue: [] }
                    ]
                };
            }
            case Entity: {
                return {
                    name: Entity,
                    properties: [
                        { name: 'attributes', defaultValue: [] },
                        { name: 'customProperties', defaultValue: [] },
                        { name: 'description' },
                        { name: 'id' },
                        { name: 'name' },
                        { name: 'superEntities', defaultValue: [] }
                    ]
                };
            }
            case EntityAttribute: {
                return {
                    name: EntityAttribute,
                    properties: [
                        { name: 'customProperties', defaultValue: [] },
                        { name: 'datatype' },
                        { name: 'description' },
                        { name: 'id' },
                        { name: 'identifier', defaultValue: false },
                        { name: 'length' },
                        { name: 'name' },
                        { name: 'precision' },
                        { name: 'scale' }
                    ]
                };
            }
            case Mapping: {
                return {
                    name: Mapping,
                    properties: [
                        { name: 'customProperties', defaultValue: [] },
                        { name: 'id' },
                        { name: 'sources', defaultValue: [] },
                        { name: 'target' }
                    ]
                };
            }
            case Relationship: {
                return {
                    name: Relationship,
                    properties: [
                        { name: 'attributes', defaultValue: [] },
                        { name: 'child' },
                        { name: 'childCardinality' },
                        { name: 'childRole' },
                        { name: 'customProperties', defaultValue: [] },
                        { name: 'description' },
                        { name: 'id' },
                        { name: 'name' },
                        { name: 'parent' },
                        { name: 'parentCardinality' },
                        { name: 'parentRole' }
                    ]
                };
            }
            case RelationshipAttribute: {
                return {
                    name: RelationshipAttribute,
                    properties: [
                        { name: 'child' },
                        { name: 'customProperties', defaultValue: [] },
                        { name: 'parent' }
                    ]
                };
            }
            case SourceObject: {
                return {
                    name: SourceObject,
                    properties: [
                        { name: 'conditions', defaultValue: [] },
                        { name: 'customProperties', defaultValue: [] },
                        { name: 'dependencies', defaultValue: [] },
                        { name: 'entity' },
                        { name: 'id' },
                        { name: 'join' }
                    ]
                };
            }
            case TargetObject: {
                return {
                    name: TargetObject,
                    properties: [
                        { name: 'customProperties', defaultValue: [] },
                        { name: 'entity' },
                        { name: 'mappings', defaultValue: [] }
                    ]
                };
            }
            case DataElement: {
                return {
                    name: DataElement,
                    properties: [
                        { name: 'datatype' },
                        { name: 'description' },
                        { name: 'id' },
                        { name: 'name' }
                    ]
                };
            }
            case DataElementContainer: {
                return {
                    name: DataElementContainer,
                    properties: [
                        { name: 'description' },
                        { name: 'id' },
                        { name: 'name' }
                    ]
                };
            }
            case DataElementContainerLink: {
                return {
                    name: DataElementContainerLink,
                    properties: [
                        { name: 'description' },
                        { name: 'id' },
                        { name: 'name' }
                    ]
                };
            }
            case EntityNodeAttribute: {
                return {
                    name: EntityNodeAttribute,
                    properties: [
                        { name: 'customProperties', defaultValue: [] },
                        { name: 'datatype' },
                        { name: 'description' },
                        { name: 'id' },
                        { name: 'identifier', defaultValue: false },
                        { name: 'length' },
                        { name: 'name' },
                        { name: 'precision' },
                        { name: 'scale' }
                    ]
                };
            }
            case SourceObjectAttribute: {
                return {
                    name: SourceObjectAttribute,
                    properties: [
                        { name: 'customProperties', defaultValue: [] },
                        { name: 'datatype' },
                        { name: 'description' },
                        { name: 'id' },
                        { name: 'identifier', defaultValue: false },
                        { name: 'length' },
                        { name: 'name' },
                        { name: 'precision' },
                        { name: 'scale' }
                    ]
                };
            }
            case TargetObjectAttribute: {
                return {
                    name: TargetObjectAttribute,
                    properties: [
                        { name: 'customProperties', defaultValue: [] },
                        { name: 'datatype' },
                        { name: 'description' },
                        { name: 'id' },
                        { name: 'identifier', defaultValue: false },
                        { name: 'length' },
                        { name: 'name' },
                        { name: 'precision' },
                        { name: 'scale' }
                    ]
                };
            }
            default: {
                return {
                    name: type,
                    properties: []
                };
            }
        }
    }
}

export const reflection = new CrossModelAstReflection();
