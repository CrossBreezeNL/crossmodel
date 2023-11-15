/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { BaseGLSPClientContribution } from '@eclipse-glsp/theia-integration';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { inject, injectable } from '@theia/core/shared/inversify';
import { OutputChannelManager } from '@theia/output/lib/browser/output-channel';
import '../../style/diagram.css';
import { CrossModelDiagramLanguage } from '../common/crossmodel-diagram-language';
import { GLSPClient } from '@eclipse-glsp/protocol';

/** The message the GLSP server outputs as soon as it is properly connected through a socket. */
export const CLIENT_CONNECTION_READY_MSG = 'Starting GLSP server connection';

/**
 * Custom GLSP client contribution that will connect to the Theia backend which will then connect to a GLSP server through a socket.
 * This contribution requires some special handling as our GLSP server might not be running as it is started through a VS Code extension.
 */
@injectable()
export class CrossModelClientContribution extends BaseGLSPClientContribution {
   @inject(OutputChannelManager) protected outputChannelManager: OutputChannelManager;

   readonly id = CrossModelDiagramLanguage.contributionId;
   readonly fileExtensions = CrossModelDiagramLanguage.fileExtensions;

   protected async waitForBackendConnected(): Promise<void> {
      // We know that our VS Code extension outputs any log on a channel called 'CrossModel'
      // So we check whether our expected message is already part of the channel's text or otherwise listen to any new content

      // While a socket connection to the server can be established earlier, the server might still do some internal initialization
      // So we wait for it to report that client connections can be accepted
      // Only then we actually start and initialize our client connection with the server
      const channel = this.outputChannelManager.getChannel('CrossModel');
      if (channel['resource'].textModel?.getValue().includes(CLIENT_CONNECTION_READY_MSG)) {
         return;
      }
      const deferred = new Deferred();
      const channelListener = channel.onContentChange(() => {
         if (channel['resource'].textModel?.getValue().includes(CLIENT_CONNECTION_READY_MSG)) {
            channelListener.dispose();
            deferred.resolve();
         }
      });
      return deferred.promise;
   }

   protected override async start(glspClient: GLSPClient): Promise<void> {
      // While a socket connection to the server can be established earlier, the server might still do some internal initialization
      // So we wait for it to report that client connections can be accepted
      // Only then we actually start and initialize our client connection with the server
      await this.waitForBackendConnected();
      return super.start(glspClient);
   }
}
