/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { Emitter } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { CrossModelRoot, ModelServiceClient } from '../common/model-service-protocol';

export interface ModelDocument {
    uri: string;
    model: CrossModelRoot;
}

@injectable()
export class ModelServiceClientImpl implements ModelServiceClient {
    protected onUpdateEmitter = new Emitter<ModelDocument>();
    onUpdate = this.onUpdateEmitter.event;

    async getName(): Promise<string> {
        return 'ModelServiceClient';
    }

    async updateModel(uri: string, model: CrossModelRoot): Promise<void> {
        this.onUpdateEmitter.fire({ uri, model });
    }
}
