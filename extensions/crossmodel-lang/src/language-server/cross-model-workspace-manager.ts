/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AstNode, DefaultWorkspaceManager, DocumentState, FileSystemNode, interruptAndCheck, LangiumDocument } from 'langium';
import { CancellationToken, Emitter, Event, WorkspaceFolder } from 'vscode-languageserver';
import { URI, Utils } from 'vscode-uri';
import { CrossModelSharedServices } from './cross-model-module';

/**
 * A cusotm workspace manager that:
 * - fires an event when the workspace is initialized (we use this for starting LSP-dependent servers)
 * - sets up a package-system on top of the workspace folders (including the 'node_modules' folder)
 * - validates all documents after workspace initialization
 */
export class CrossModelWorkspaceManager extends DefaultWorkspaceManager {
   protected onWorkspaceInitializedEmitter = new Emitter<void>();

   constructor(protected services: CrossModelSharedServices, protected logger = services.logger.ClientLogger) {
      super(services);
      const buildListener = this.documentBuilder.onBuildPhase(DocumentState.Validated, () => {
         this.logger.info('Workspace Initialized');
         buildListener.dispose();
         this.onWorkspaceInitializedEmitter.fire();
      });
   }

   get onWorkspaceInitialized(): Event<void> {
      return this.onWorkspaceInitializedEmitter.event;
   }

   override async initializeWorkspace(folders: WorkspaceFolder[], cancelToken = CancellationToken.None): Promise<void> {
      // Note: same as super implementation but we also call validation on the build and fire an event after we are done
      // so that any errors are shown even without modifying any documents

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

      // CHANGE: Use validation 'all'
      await this.documentBuilder.build(documents, { validationChecks: 'all' }, cancelToken);
   }

   protected override async loadAdditionalDocuments(
      folders: WorkspaceFolder[],
      _collector: (document: LangiumDocument<AstNode>) => void
   ): Promise<void> {
      // build up package-system based on the workspace
      return this.services.workspace.PackageManager.initialize(folders);
   }

   protected override includeEntry(_workspaceFolder: WorkspaceFolder, entry: FileSystemNode, fileExtensions: string[]): boolean {
      // Note: same as super implementation but we also allow 'node_modules' directories to be scanned
      const name = Utils.basename(entry.uri);
      if (name.startsWith('.')) {
         return false;
      }
      if (entry.isDirectory) {
         // CHANGE: Also support 'node_modules' directory
         return name !== 'out';
      } else if (entry.isFile) {
         const extname = Utils.extname(entry.uri);
         return fileExtensions.includes(extname);
      }
      return false;
   }
}
