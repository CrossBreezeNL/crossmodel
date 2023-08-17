/******************************************************************************
 * This file was generated by langium-cli 1.1.0.
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

/* eslint-disable */
import { AstNode, AbstractAstReflection, Reference, ReferenceInfo, TypeMetaData } from 'langium';

export type QualifiedName = string;

export type RelationshipType = '1:1' | '1:n' | 'n:1' | 'n:m';

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
    for?: Reference<Relationship>
    name?: string
}

export const DiagramEdge = 'DiagramEdge';

export function isDiagramEdge(item: unknown): item is DiagramEdge {
    return reflection.isInstance(item, DiagramEdge);
}

export interface DiagramNode extends AstNode {
    readonly $container: SystemDiagram;
    readonly $type: 'DiagramNode';
    description?: string
    for?: Reference<Entity>
    height?: number
    name?: string
    name_val?: string
    width?: number
    x?: number
    y?: number
}

export const DiagramNode = 'DiagramNode';

export function isDiagramNode(item: unknown): item is DiagramNode {
    return reflection.isInstance(item, DiagramNode);
}

export interface Entity extends AstNode {
    readonly $container: CrossModelRoot;
    readonly $type: 'Entity';
    attributes: Array<EntityAttribute>
    description?: string
    name?: string
    name_val?: string
}

export const Entity = 'Entity';

export function isEntity(item: unknown): item is Entity {
    return reflection.isInstance(item, Entity);
}

export interface EntityAttribute extends AstNode {
    readonly $container: Entity;
    readonly $type: 'EntityAttribute';
    datatype?: string
    description?: string
    name?: string
    name_val?: string
}

export const EntityAttribute = 'EntityAttribute';

export function isEntityAttribute(item: unknown): item is EntityAttribute {
    return reflection.isInstance(item, EntityAttribute);
}

export interface Relationship extends AstNode {
    readonly $container: CrossModelRoot;
    readonly $type: 'Relationship';
    child?: Reference<Entity>
    description?: string
    name?: string
    name_val?: string
    parent?: Reference<Entity>
    type?: RelationshipType
}

export const Relationship = 'Relationship';

export function isRelationship(item: unknown): item is Relationship {
    return reflection.isInstance(item, Relationship);
}

export interface SystemDiagram extends AstNode {
    readonly $container: CrossModelRoot;
    readonly $type: 'SystemDiagram';
    description?: string
    edges: Array<DiagramEdge>
    name?: string
    name_val?: string
    nodes: Array<DiagramNode>
}

export const SystemDiagram = 'SystemDiagram';

export function isSystemDiagram(item: unknown): item is SystemDiagram {
    return reflection.isInstance(item, SystemDiagram);
}

export interface CrossModelAstType {
    CrossModelRoot: CrossModelRoot
    DiagramEdge: DiagramEdge
    DiagramNode: DiagramNode
    Entity: Entity
    EntityAttribute: EntityAttribute
    Relationship: Relationship
    SystemDiagram: SystemDiagram
}

export class CrossModelAstReflection extends AbstractAstReflection {

    getAllTypes(): string[] {
        return ['CrossModelRoot', 'DiagramEdge', 'DiagramNode', 'Entity', 'EntityAttribute', 'Relationship', 'SystemDiagram'];
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
            case 'DiagramEdge:for': {
                return Relationship;
            }
            case 'DiagramNode:for':
            case 'Relationship:child':
            case 'Relationship:parent': {
                return Entity;
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
