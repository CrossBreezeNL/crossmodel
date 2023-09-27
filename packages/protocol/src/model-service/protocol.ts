/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as rpc from 'vscode-jsonrpc/node';

/**
 * Serialized version of the semantic model generated by Langium.
 */

export interface CrossModelRoot {
    readonly $type: 'CrossModelRoot';
    entity?: Entity;
    relationship?: Relationship;
}

export function isCrossModelRoot(model?: any): model is CrossModelRoot {
    return !!model && model.$type === 'CrossModelRoot';
}

export interface Entity {
    readonly $type: 'Entity';
    attributes: Array<EntityAttribute>;
    description?: string;
    name?: string;
    name_val?: string;
}

export interface EntityAttribute {
    readonly $type: 'EntityAttribute';
    datatype?: string;
    description?: string;
    name?: string;
    name_val?: string;
}

export interface Relationship {
    readonly $type: 'Relationship';
    child?: string;
    description?: string;
    name?: string;
    name_val?: string;
    parent?: string;
    type?: string;
}

export interface DiagramNodeEntity {
    uri: string;
    model: CrossModelRoot;
}

export function isDiagramNodeEntity(model?: any): model is DiagramNodeEntity {
    return !!model && model.uri && model.model && isCrossModelRoot(model.model);
}

export const OpenModel = new rpc.RequestType1<string, void, void>('server/open');
export const CloseModel = new rpc.RequestType1<string, void, void>('server/close');
export const RequestModel = new rpc.RequestType1<string, CrossModelRoot | undefined, void>('server/request');
export const RequestModelDiagramNode = new rpc.RequestType2<string, string, DiagramNodeEntity | undefined, void>(
    'server/requestModelDiagramNode'
);
export const UpdateModel = new rpc.RequestType2<string, CrossModelRoot, CrossModelRoot, void>('server/update');
export const SaveModel = new rpc.RequestType2<string, CrossModelRoot, void, void>('server/save');
export const OnSave = new rpc.NotificationType2<string, CrossModelRoot>('server/onSave');
export const OnUpdated = new rpc.NotificationType2<string, CrossModelRoot>('server/onUpdated');
