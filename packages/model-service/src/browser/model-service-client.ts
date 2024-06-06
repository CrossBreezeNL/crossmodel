/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelRoot, ModelUpdatedEvent, SystemUpdatedEvent } from '@crossbreeze/protocol';
import { Emitter } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { ModelServiceClient } from '../common/model-service-rpc';

@injectable()
export class ModelServiceClientImpl implements ModelServiceClient {
   protected onModelUpdateEmitter = new Emitter<ModelUpdatedEvent<CrossModelRoot>>();
   onModelUpdate = this.onModelUpdateEmitter.event;

   protected onSystemUpdateEmitter = new Emitter<SystemUpdatedEvent>();
   onSystemUpdate = this.onSystemUpdateEmitter.event;

   protected onReadyEmitter = new Emitter<void>();
   onReady = this.onReadyEmitter.event;

   async getName(): Promise<string> {
      return 'ModelServiceClient';
   }

   async ready(): Promise<void> {
      this.onReadyEmitter.fire();
   }

   async updateModel(event: ModelUpdatedEvent<CrossModelRoot>): Promise<void> {
      this.onModelUpdateEmitter.fire(event);
   }

   async updateSystem(event: SystemUpdatedEvent): Promise<void> {
      this.onSystemUpdateEmitter.fire(event);
   }
}
