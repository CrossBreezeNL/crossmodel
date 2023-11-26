/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AstNode, DefaultWorkspaceManager, FileSystemNode, LangiumDocument } from 'langium';
import { CancellationToken, Emitter, Event, WorkspaceFolder } from 'vscode-languageserver';
import { URI, Utils } from 'vscode-uri';
import { CrossModelSharedServices } from './cross-model-module.js';

/**
 * A custom workspace manager that:
 * - fires an event when the workspace is initialized (we use this for starting LSP-dependent servers)
 * - sets up a package-system on top of the workspace folders (including the 'node_modules' folder)
 * - validates all documents after workspace initialization
 */
export class CrossModelWorkspaceManager extends DefaultWorkspaceManager {
   protected onWorkspaceInitializedEmitter = new Emitter<URI[]>();

   constructor(
      protected services: CrossModelSharedServices,
      protected logger = services.logger.ClientLogger
   ) {
      super(services);
      this.initialBuildOptions = { validation: true };
   }

   override async initializeWorkspace(folders: WorkspaceFolder[], cancelToken?: CancellationToken | undefined): Promise<void> {
      await super.initializeWorkspace(folders, cancelToken);
      this.logger.info('Workspace Initialized');
      this.onWorkspaceInitializedEmitter.fire((this.folders || []).map(folder => this.getRootFolder(folder)));
   }

   get onWorkspaceInitialized(): Event<URI[]> {
      return this.onWorkspaceInitializedEmitter.event;
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
