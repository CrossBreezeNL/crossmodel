/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { GLSPClient } from '@eclipse-glsp/protocol';
import { BaseGLSPClientContribution } from '@eclipse-glsp/theia-integration';
import { DisposableCollection } from '@theia/core';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { OutputChannelManager } from '@theia/output/lib/browser/output-channel';
import '../../style/diagram.css';
import { CrossModelDiagramLanguage } from '../common/crossmodel-diagram-language';

export const SERVER_READY_MSG = '[GLSP-Server]:Startup completed';
export const CLIENT_CONNECTION_READY_MSG = 'Starting GLSP server connection for client';

@injectable()
export class CrossModelClientContribution extends BaseGLSPClientContribution {
   @inject(OutputChannelManager) protected outputChannelManager: OutputChannelManager;

   readonly id = CrossModelDiagramLanguage.contributionId;
   readonly fileExtensions = CrossModelDiagramLanguage.fileExtensions;

   protected serverReady: Promise<void>;
   protected clientConnectionReady: Promise<void>;

   @postConstruct()
   protected init(): void {
      this.serverReady = this.listenToServerOutput(SERVER_READY_MSG);
      this.clientConnectionReady = this.listenToServerOutput(CLIENT_CONNECTION_READY_MSG);
   }

   protected listenToServerOutput(msg: string): Promise<void> {
      const deferred = new Deferred();
      const channel = this.outputChannelManager.getChannel('CrossModel');
      if (channel['resource'].textModel?.getValue().includes(msg)) {
         deferred.resolve();
      } else {
         const channelListener = channel.onContentChange(() => {
            if (channel['resource'].textModel?.getValue().includes(msg)) {
               channelListener.dispose();
               deferred.resolve();
            }
         });
      }
      return deferred.promise;
   }

   protected override async doActivate(toStop: DisposableCollection): Promise<void> {
      await this.serverReady;
      return super.doActivate(toStop);
   }

   protected override async onWillStart(languageClient: GLSPClient): Promise<void> {
      await this.clientConnectionReady;
      super.onWillStart(languageClient);
   }
}
