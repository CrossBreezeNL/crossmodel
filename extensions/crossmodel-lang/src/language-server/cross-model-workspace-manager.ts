/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { DefaultWorkspaceManager } from 'langium';
import { CancellationToken, Emitter, Event, WorkspaceFolder } from 'vscode-languageserver';
import { URI } from 'vscode-uri';
import { CrossModelSharedServices } from './cross-model-module';
import { Utils } from './util/uri-util';

export class CrossModelWorkspaceManager extends DefaultWorkspaceManager {
   protected onWorkspaceInitializedEmitter = new Emitter<void>();
   protected workspaceFolders: URI[] = [];

   constructor(protected services: CrossModelSharedServices, protected logger = services.logger.ClientLogger) {
      super(services);
      services.lsp.LanguageServer.onInitialize(params => {
         this.workspaceFolders = params.workspaceFolders?.map(folder => this.getRootFolder(folder)) || [];
      });
   }

   get onWorkspaceInitialized(): Event<void> {
      return this.onWorkspaceInitializedEmitter.event;
   }

   override async initializeWorkspace(folders: WorkspaceFolder[], cancelToken?: CancellationToken | undefined): Promise<void> {
      await super.initializeWorkspace(folders, cancelToken);
      this.logger.info('Workspace Initialized');
      this.onWorkspaceInitializedEmitter.fire();
   }

   findWorkspaceFolder(uri?: URI): URI | undefined {
      return !uri ? undefined : this.workspaceFolders.find(folder => Utils.isChildOf(folder, uri));
   }

   areInSameWorkspace(...uris: URI[]): boolean {
      return Utils.matchSameFolder(uri => this.findWorkspaceFolder(uri), ...uris);
   }
}
