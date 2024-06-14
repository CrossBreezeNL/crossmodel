/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
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
import { Event } from '@theia/core';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { ModelService, ModelServiceClient, ModelServiceServer } from '../common';

@injectable()
export class ModelServiceImpl implements ModelService {
   @inject(ModelServiceServer) protected readonly server: ModelServiceServer;
   @inject(ModelServiceClient) protected readonly client: ModelServiceClient;

   systems: SystemInfo[] = [];

   @postConstruct()
   protected init(): void {
      this.initSystemInfos();
   }

   protected async initSystemInfos(): Promise<void> {
      this.systems = await this.server.getSystemInfos();
      this.client.onSystemUpdate(event => {
         this.systems = this.systems.filter(
            system => system.id !== event.system.id || system.packageFilePath !== event.system.packageFilePath
         );
         if (event.reason === 'added') {
            this.systems.push(event.system);
         }
      });
   }

   open(args: OpenModelArgs): Promise<CrossModelRoot | undefined> {
      return this.server.open(args);
   }

   close(args: CloseModelArgs): Promise<void> {
      return this.server.close(args);
   }

   update(args: UpdateModelArgs<CrossModelRoot>): Promise<CrossModelRoot> {
      return this.server.update(args);
   }

   save(args: SaveModelArgs<CrossModelRoot>): Promise<void> {
      return this.server.save(args);
   }

   request(uri: string): Promise<CrossModelRoot | undefined> {
      return this.server.request(uri);
   }

   findReferenceableElements(args: CrossReferenceContext): Promise<ReferenceableElement[]> {
      return this.server.findReferenceableElements(args);
   }

   resolveReference(reference: CrossReference): Promise<ResolvedElement | undefined> {
      return this.server.resolveReference(reference);
   }

   getSystemInfos(): Promise<SystemInfo[]> {
      return this.server.getSystemInfos();
   }

   getSystemInfo(args: SystemInfoArgs): Promise<SystemInfo | undefined> {
      return this.server.getSystemInfo(args);
   }

   get onModelUpdate(): Event<ModelUpdatedEvent<CrossModelRoot>> {
      return this.client.onModelUpdate;
   }

   get onSystemUpdate(): Event<SystemUpdatedEvent> {
      return this.client.onSystemUpdate;
   }

   get onReady(): Event<void> {
      return this.client.onReady;
   }
}
