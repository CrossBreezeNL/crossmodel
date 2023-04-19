/******************************************************************************
 * This file was generated by langium-cli 1.1.0.
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

/* eslint-disable */
import { AstNode, AbstractAstReflection, Reference, ReferenceInfo, TypeMetaData } from 'langium';

export type QualifiedName = string;

export type RelationshipType = '1:1' | '1:n' | 'n:1' | 'n:m';

export interface Attribute extends AstNode {
    readonly $container: Entity;
    readonly $type: 'Attribute';
    name: string
    value: number | string
}

export const Attribute = 'Attribute';

export function isAttribute(item: unknown): item is Attribute {
    return reflection.isInstance(item, Attribute);
}

export interface CrossModelRoot extends AstNode {
    readonly $type: 'CrossModelRoot';
    diagram?: SystemDiagram
    entity?: Entity
    relationship?: Relationship
}

export const CrossModelRoot = 'CrossModelRoot';

export function isCrossModelRoot(item: unknown): item is CrossModelRoot {
    return reflection.isInstance(item, CrossModelRoot);
}

export interface DiagramEdge extends AstNode {
    readonly $container: SystemDiagram;
    readonly $type: 'DiagramEdge';
    name: string
    semanticElement: Reference<Relationship>
    source: Reference<DiagramNode>
    target: Reference<DiagramNode>
}

export const DiagramEdge = 'DiagramEdge';

export function isDiagramEdge(item: unknown): item is DiagramEdge {
    return reflection.isInstance(item, DiagramEdge);
}

export interface DiagramNode extends AstNode {
    readonly $container: SystemDiagram;
    readonly $type: 'DiagramNode';
    height: number
    name: string
    semanticElement: Reference<Entity>
    width: number
    x: number
    y: number
}

export const DiagramNode = 'DiagramNode';

export function isDiagramNode(item: unknown): item is DiagramNode {
    return reflection.isInstance(item, DiagramNode);
}

export interface Entity extends AstNode {
    readonly $container: CrossModelRoot;
    readonly $type: 'Entity';
    attributes: Array<Attribute>
    description: string
    name: string
}

export const Entity = 'Entity';

export function isEntity(item: unknown): item is Entity {
    return reflection.isInstance(item, Entity);
}

export interface Property extends AstNode {
    readonly $container: Relationship;
    readonly $type: 'Property';
    key: string
    value: number | string
}

export const Property = 'Property';

export function isProperty(item: unknown): item is Property {
    return reflection.isInstance(item, Property);
}

export interface Relationship extends AstNode {
    readonly $container: CrossModelRoot;
    readonly $type: 'Relationship';
    name: string
    properties: Array<Property>
    source: Reference<Entity>
    sourceAttribute?: Reference<Attribute>
    target: Reference<Entity>
    targetAttribute?: Reference<Attribute>
    type: RelationshipType
}

export const Relationship = 'Relationship';

export function isRelationship(item: unknown): item is Relationship {
    return reflection.isInstance(item, Relationship);
}

export interface SystemDiagram extends AstNode {
    readonly $container: CrossModelRoot;
    readonly $type: 'SystemDiagram';
    edges: Array<DiagramEdge>
    nodes: Array<DiagramNode>
}

export const SystemDiagram = 'SystemDiagram';

export function isSystemDiagram(item: unknown): item is SystemDiagram {
    return reflection.isInstance(item, SystemDiagram);
}

export interface CrossModelAstType {
    Attribute: Attribute
    CrossModelRoot: CrossModelRoot
    DiagramEdge: DiagramEdge
    DiagramNode: DiagramNode
    Entity: Entity
    Property: Property
    Relationship: Relationship
    SystemDiagram: SystemDiagram
}

export class CrossModelAstReflection extends AbstractAstReflection {

    getAllTypes(): string[] {
        return ['Attribute', 'CrossModelRoot', 'DiagramEdge', 'DiagramNode', 'Entity', 'Property', 'Relationship', 'SystemDiagram'];
    }

    protected override computeIsSubtype(subtype: string, supertype: string): boolean {
        switch (subtype) {
            default: {
                return false;
            }
        }
    }

    getReferenceType(refInfo: ReferenceInfo): string {
        const referenceId = `${refInfo.container.$type}:${refInfo.property}`;
        switch (referenceId) {
            case 'DiagramEdge:semanticElement': {
                return Relationship;
            }
            case 'DiagramEdge:source':
            case 'DiagramEdge:target': {
                return DiagramNode;
            }
            case 'DiagramNode:semanticElement':
            case 'Relationship:source':
            case 'Relationship:target': {
                return Entity;
            }
            case 'Relationship:sourceAttribute':
            case 'Relationship:targetAttribute': {
                return Attribute;
            }
            default: {
                throw new Error(`${referenceId} is not a valid reference id.`);
            }
        }
    }

    getTypeMetaData(type: string): TypeMetaData {
        switch (type) {
            case 'Entity': {
                return {
                    name: 'Entity',
                    mandatory: [
                        { name: 'attributes', type: 'array' }
                    ]
                };
            }
            case 'Relationship': {
                return {
                    name: 'Relationship',
                    mandatory: [
                        { name: 'properties', type: 'array' }
                    ]
                };
            }
            case 'SystemDiagram': {
                return {
                    name: 'SystemDiagram',
                    mandatory: [
                        { name: 'edges', type: 'array' },
                        { name: 'nodes', type: 'array' }
                    ]
                };
            }
            default: {
                return {
                    name: type,
                    mandatory: []
                };
            }
        }
    }
}

export const reflection = new CrossModelAstReflection();