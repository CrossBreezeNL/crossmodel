/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelRoot, DiagramNodeEntity } from '@crossbreeze/protocol';
import { JsonRpcServer } from '@theia/core';

/** Path used to communicate between the Theia frontend and backend */
export const MODEL_SERVICE_PATH = '/services/model-service';

/**
 * Protocol used by the Theia frontend-backend communication
 */
export const ModelService = Symbol('ModelService');
export interface ModelService extends JsonRpcServer<ModelServiceClient> {
    open(uri: string): Promise<void>;
    close(uri: string): Promise<void>;
    request(uri: string): Promise<CrossModelRoot | undefined>;
    requestDiagramNodeEntityModel(uri: string, id: string): Promise<DiagramNodeEntity | undefined>;
    update(uri: string, model: CrossModelRoot): Promise<CrossModelRoot>;
    save(uri: string, model: CrossModelRoot): Promise<void>;
}

export const ModelServiceClient = Symbol('ModelServiceClient');
export interface ModelServiceClient {
    getName(): Promise<string>;
    updateModel(uri: string, model: CrossModelRoot): Promise<void>;
}
