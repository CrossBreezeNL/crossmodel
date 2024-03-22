/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import {
   CloseModelArgs,
   CrossModelRoot,
   CrossReference,
   CrossReferenceContext,
   ModelUpdatedEvent,
   OpenModelArgs,
   ReferenceableElement,
   ResolvedElement,
   SaveModelArgs,
   SystemInfo,
   SystemInfoArgs,
   UpdateModelArgs
} from '@crossbreeze/protocol';
import { Event, RpcServer } from '@theia/core';

/** Path used to communicate between the Theia frontend and backend */
export const MODEL_SERVICE_PATH = '/services/model-service';

/**
 * Protocol used by the Theia frontend-backend communication
 */
export const ModelService = Symbol('ModelService');
export interface ModelService extends RpcServer<ModelServiceClient> {
   open(args: OpenModelArgs): Promise<CrossModelRoot | undefined>;
   close(args: CloseModelArgs): Promise<void>;
   request(uri: string): Promise<CrossModelRoot | undefined>;
   findReferenceableElements(args: CrossReferenceContext): Promise<ReferenceableElement[]>;
   resolveReference(reference: CrossReference): Promise<ResolvedElement | undefined>;
   update(args: UpdateModelArgs<CrossModelRoot>): Promise<CrossModelRoot>;
   save(args: SaveModelArgs<CrossModelRoot>): Promise<void>;
   getSystemInfo(args: SystemInfoArgs): Promise<SystemInfo | undefined>;
}

export const ModelServiceClient = Symbol('ModelServiceClient');
export interface ModelServiceClient {
   getName(): Promise<string>;
   updateModel(args: ModelUpdatedEvent<CrossModelRoot>): Promise<void>;
   onUpdate: Event<ModelUpdatedEvent<CrossModelRoot>>;
}
