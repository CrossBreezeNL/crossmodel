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
   SystemUpdatedEvent,
   UpdateModelArgs
} from '@crossbreeze/protocol';
import { Event, RpcServer } from '@theia/core';

/** Path used to communicate between the Theia frontend and backend */
export const MODEL_SERVICE_PATH = '/services/model-service';

export const ModelService = Symbol('ModelService');
export interface ModelService
   extends Omit<ModelServiceServer, 'setClient' | 'getClient' | 'dispose'>,
      Omit<ModelServiceClient, 'getName' | 'updateModel' | 'updateSystem' | 'ready'> {
   systems: SystemInfo[];
}

/**
 * Protocol used by the Theia frontend-backend communication
 */
export const ModelServiceServer = Symbol('ModelServiceServer');
export interface ModelServiceServer extends RpcServer<ModelServiceClient> {
   // Model API
   open(args: OpenModelArgs): Promise<CrossModelRoot | undefined>;
   close(args: CloseModelArgs): Promise<void>;
   update(args: UpdateModelArgs<CrossModelRoot>): Promise<CrossModelRoot>;
   save(args: SaveModelArgs<CrossModelRoot>): Promise<void>;

   // Query API
   request(uri: string): Promise<CrossModelRoot | undefined>;
   findReferenceableElements(args: CrossReferenceContext): Promise<ReferenceableElement[]>;
   resolveReference(reference: CrossReference): Promise<ResolvedElement | undefined>;

   // System API
   getSystemInfos(): Promise<SystemInfo[]>;
   getSystemInfo(args: SystemInfoArgs): Promise<SystemInfo | undefined>;
}

export const ModelServiceClient = Symbol('ModelServiceClient');
export interface ModelServiceClient {
   getName(): Promise<string>;
   ready(): Promise<void>;
   onReady: Event<void>;
   updateModel(args: ModelUpdatedEvent<CrossModelRoot>): Promise<void>;
   onModelUpdate: Event<ModelUpdatedEvent<CrossModelRoot>>;
   updateSystem(args: SystemUpdatedEvent): Promise<void>;
   onSystemUpdate: Event<SystemUpdatedEvent>;
}
