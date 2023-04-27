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

/** The message the GLSP server outputs as soon as it is running. */
export const SERVER_READY_MSG = '[GLSP-Server]:Startup completed';
/** The message the GLSP server outputs as soon as it is ready to accept client connections. */
export const CLIENT_CONNECTION_READY_MSG = 'Starting GLSP server connection for client';

/**
 * Custom GLSP client contribution that will connect to the Theia backend which will then connect to a GLSP server through a socket.
 * This contribution requires some special handling as our GLSP server might not be running as it is started through a VS Code extension.
 */
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
      // We know that our VS Code extension outputs any log on a channel called 'CrossModel'
      // So we check whether our expected message is already part of the channel's text or otherwise listen to any new content
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
      // As soon as we connect to the backend contribution, the connection will be forwarded to the socket server
      // So we need to make sure that the GLSP server is running before we connect
      await this.serverReady;
      return super.doActivate(toStop);
   }

   protected override async onWillStart(languageClient: GLSPClient): Promise<void> {
      // While a socket connection to the server can be established earlier, the server might still do some internal initialization
      // So we wait for it to report that client connections can be accepted
      // Only then we actually start and initialize our client connection with the server
      await this.clientConnectionReady;
      super.onWillStart(languageClient);
   }
}
