/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelRoot, ModelUpdatedEvent } from '@crossbreeze/protocol';
import { Emitter } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { ModelServiceClient } from '../common/model-service-rpc';

@injectable()
export class ModelServiceClientImpl implements ModelServiceClient {
    protected onUpdateEmitter = new Emitter<ModelUpdatedEvent<CrossModelRoot>>();
    onUpdate = this.onUpdateEmitter.event;

    async getName(): Promise<string> {
        return 'ModelServiceClient';
    }

    async updateModel(event: ModelUpdatedEvent<CrossModelRoot>): Promise<void> {
        this.onUpdateEmitter.fire(event);
    }
}
