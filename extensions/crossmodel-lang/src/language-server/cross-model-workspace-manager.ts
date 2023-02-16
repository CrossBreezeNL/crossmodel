/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { DefaultWorkspaceManager, interruptAndCheck, LangiumDocument } from 'langium';
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

   override async initializeWorkspace(folders: WorkspaceFolder[], cancelToken = CancellationToken.None): Promise<void> {
      // same as super implementation but we also call validation on the build and fire an event after we are done
      const fileExtensions = this.serviceRegistry.all.flatMap(e => e.LanguageMetaData.fileExtensions);
      const documents: LangiumDocument[] = [];
      const collector = (document: LangiumDocument): void => {
         documents.push(document);
         if (!this.langiumDocuments.hasDocument(document.uri)) {
            this.langiumDocuments.addDocument(document);
         }
      };
      // Even though we don't await the initialization of the workspace manager,
      // we can still assume that all library documents and file documents are loaded by the time we start building documents.
      // The mutex prevents anything from performing a workspace build until we check the cancellation token
      await this.loadAdditionalDocuments(folders, collector);
      await Promise.all(
         folders
            .map(wf => [wf, this.getRootFolder(wf)] as [WorkspaceFolder, URI])
            .map(async entry => this.traverseFolder(...entry, fileExtensions, collector))
      );
      // Only after creating all documents do we check whether we need to cancel the initialization
      // The document builder will later pick up on all unprocessed documents
      await interruptAndCheck(cancelToken);
      await this.documentBuilder.build(documents, { validationChecks: 'all' }, cancelToken);
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
