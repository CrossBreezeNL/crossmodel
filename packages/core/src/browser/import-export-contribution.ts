/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { ModelService } from '@crossbreeze/model-service/lib/common';
import { ModelFileExtensions, ModelFileType, ModelStructure, SystemInfo } from '@crossbreeze/protocol';
import {
   CancellationTokenSource,
   Command,
   CommandContribution,
   CommandRegistry,
   MenuContribution,
   MenuModelRegistry,
   MessageService,
   Path,
   QuickPickItem,
   QuickPickService,
   SelectionService,
   URI
} from '@theia/core';
import { CommonMenus, ConfirmDialog, OpenerService, open } from '@theia/core/lib/browser';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
import { UriAwareCommandHandler } from '@theia/core/lib/common/uri-command-handler';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { NAVIGATOR_CONTEXT_MENU } from '@theia/navigator/lib/browser/navigator-contribution';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { inject, injectable } from 'inversify';
// eslint-disable-next-line import/no-unresolved
import { PackageJson } from 'type-fest';
import * as yaml from 'yaml';

const FILE_DOWNLOAD_UPLOAD = [...CommonMenus.FILE, '4_downloadupload'];
const FILE_IMPORT_EXPORT_SUBMENU = [...FILE_DOWNLOAD_UPLOAD, '1_import_export'];

const NAV_DOWNLOAD_UPLOAD = [...NAVIGATOR_CONTEXT_MENU, '6_downloadupload'];

const EXPORT_YAML_SYSTEM_NAV: Command = {
   id: 'crossmodel.export.yaml.nav',
   label: 'Export System as File'
};

const EXPORT_YAML_SYSTEM_FILE: Command = {
   id: 'crossmodel.export.yaml.file',
   label: 'Export System as File'
};

const IMPORT_YAML_SYSTEM_NAV: Command = {
   id: 'crossmodel.import.yaml.nav',
   label: 'Import System from File'
};

const IMPORT_YAML_SYSTEM_FILE: Command = {
   id: 'crossmodel.import.yaml.file',
   label: 'Import System from File'
};

const EXPORT_FILE_EXTENSION = 'cmexport';
const METADATA_PREFIX = 'GENERATED-EXPORT-';

export interface ExportMetadata extends Record<string, string> {
   APPLICATION: string;
   TIME: string;
   ORIGIN: string;
}

@injectable()
export class ImportExportContribution implements CommandContribution, MenuContribution {
   @inject(SelectionService) protected readonly selectionService: SelectionService;
   @inject(WorkspaceService) protected readonly workspaceService: WorkspaceService;
   @inject(OpenerService) protected readonly openerService: OpenerService;
   @inject(FileService) protected readonly fileService: FileService;
   @inject(FileDialogService) protected readonly fileDialogService: FileDialogService;
   @inject(MessageService) protected readonly messageService: MessageService;
   @inject(ModelService) protected readonly modelService: ModelService;
   @inject(QuickPickService) protected quickPick: QuickPickService;

   registerCommands(commands: CommandRegistry): void {
      // File commands (only work with workspace context)
      commands.registerCommand(EXPORT_YAML_SYSTEM_FILE, {
         execute: async () => this.exportSystem(await this.querySystemFromUser()),
         isVisible: () => this.modelService.systems.length > 0
      });
      commands.registerCommand(IMPORT_YAML_SYSTEM_FILE, {
         execute: () => this.importSystem(this.workspaceService.tryGetRoots()[0].resource),
         isVisible: () => this.workspaceService.tryGetRoots().length > 0
      });

      // Navigator commands (consider selected elements in the tree)
      commands.registerCommand(
         EXPORT_YAML_SYSTEM_NAV,
         UriAwareCommandHandler.MonoSelect(this.selectionService, {
            execute: uri => this.exportSystem(this.findSystemToExport(uri)),
            isVisible: uri => !!this.findSystemToExport(uri)
         })
      );
      commands.registerCommand(
         IMPORT_YAML_SYSTEM_NAV,
         UriAwareCommandHandler.MonoSelect(this.selectionService, {
            execute: uri => this.importSystem(this.findDirectoryToImport(uri)!),
            isVisible: uri => !!this.findDirectoryToImport(uri)
         })
      );
   }

   registerMenus(menus: MenuModelRegistry): void {
      menus.registerSubmenu(FILE_IMPORT_EXPORT_SUBMENU, 'Import / Export', { order: 'c' });
      menus.registerMenuAction(FILE_IMPORT_EXPORT_SUBMENU, { commandId: IMPORT_YAML_SYSTEM_FILE.id, order: 'a' });
      menus.registerMenuAction(FILE_IMPORT_EXPORT_SUBMENU, { commandId: EXPORT_YAML_SYSTEM_FILE.id, order: 'b' });

      menus.registerMenuAction(NAV_DOWNLOAD_UPLOAD, { commandId: IMPORT_YAML_SYSTEM_NAV.id, order: 'b' });
      menus.registerMenuAction(NAV_DOWNLOAD_UPLOAD, { commandId: EXPORT_YAML_SYSTEM_NAV.id, order: 'bb' });
   }

   //
   // EXPORT
   //

   protected findSystemToExport(uri: URI): SystemInfo | undefined {
      const contextPath = uri.path.fsPath();
      return this.modelService.systems.find(system => system.directory === contextPath);
   }

   protected async querySystemFromUser(): Promise<SystemInfo | undefined> {
      if (this.modelService.systems.length === 0) {
         return undefined;
      }
      const systemPick = await this.quickPick.show(this.modelService.systems.map(system => this.toQuickPickItem(system)));
      return systemPick?.system;
   }

   protected toQuickPickItem(system: SystemInfo): QuickPickItem & { system: SystemInfo } {
      const directory = URI.fromFilePath(system.directory);
      const wsRoot = this.workspaceService.getWorkspaceRootUri(directory);
      const location = wsRoot?.relative(directory)?.fsPath() ?? directory.path.fsPath();
      return { label: system.name, description: system.id, detail: location, system };
   }

   async exportSystem(context?: SystemInfo): Promise<void> {
      if (!context) {
         return;
      }

      const system = await this.modelService.getSystemInfo({ contextUri: context.packageFilePath });
      if (!system) {
         this.messageService.error('Could not find system for ' + context.directory);
         return;
      }
      const systemPackageUri = URI.fromFilePath(system.packageFilePath);
      const systemPackageContent = await this.fileService.read(systemPackageUri);
      const systemPackageJson = JSON.parse(systemPackageContent.value) as PackageJson;

      const systemDirectory = URI.fromFilePath(system.directory);

      const saveDirectory = await this.fileService.resolve(systemPackageUri.parent);
      const exportFileUri = await this.fileDialogService.showSaveDialog(
         {
            title: `Export ${system.name} to File`,
            saveLabel: 'Export',
            inputValue: system.name + '.' + EXPORT_FILE_EXTENSION,
            filters: { 'All Files': [], 'System Export Files': [EXPORT_FILE_EXTENSION] }
         },
         saveDirectory
      );
      if (!exportFileUri) {
         return;
      }

      const time = new Date().toLocaleString();
      const cancel = new CancellationTokenSource();
      const progress = await this.messageService.showProgress(
         {
            text: `Export ${system.name} with ${system.modelFilePaths.length} files`,
            options: { cancelable: true, timeout: 2000 }
         },
         () => cancel.cancel()
      );

      const totalWork = system.modelFilePaths.length + 2; // +1 for package.json document, +1 for writing result
      const documents: yaml.Document[] = [];

      try {
         progress.report({ message: system.packageFilePath, work: { done: 0, total: totalWork } });
         const packageYaml = yaml.stringify(systemPackageJson);
         const packageDocument = yaml.parseDocument(packageYaml);
         this.addMetadata(packageDocument, {
            APPLICATION: FrontendApplicationConfigProvider.get().applicationName,
            TIME: time,
            ORIGIN: systemPackageUri.path.base
         });
         documents.push(packageDocument);

         for (const [idx, modelFilePath] of system.modelFilePaths.entries()) {
            if (cancel.token.isCancellationRequested) {
               return;
            }
            const modelFileUri = URI.fromFilePath(modelFilePath);
            const systemRelativePath = systemDirectory.relative(modelFileUri);
            const modelPath = systemRelativePath?.toString() ?? modelFilePath;

            progress.report({ message: modelPath, work: { done: idx + 1, total: totalWork } });
            const modelContent = await this.fileService.read(modelFileUri);
            const modelDocument = yaml.parseDocument(modelContent.value);
            this.addMetadata(modelDocument, {
               APPLICATION: FrontendApplicationConfigProvider.get().applicationName,
               TIME: time,
               ORIGIN: modelPath
            });
            documents.push(modelDocument);
         }
         if (cancel.token.isCancellationRequested) {
            return;
         }

         progress.report({ message: 'Writing Export', work: { done: totalWork, total: totalWork } });
         const systemYaml = documents.map(doc => doc.toString()).join(this.documentDelimiter());
         await this.fileService.write(exportFileUri, systemYaml);

         if (this.workspaceService.getWorkspaceRootUri(exportFileUri)) {
            // file was saved in workspace
            open(this.openerService, exportFileUri);
         }
      } finally {
         progress.cancel();
      }
   }

   protected documentDelimiter(): string {
      return '...\n'; // YAML document end marker: https://yaml.org/spec/1.2.2/#rule-c-document-end
   }

   protected addMetadata(document: yaml.Document, metadata: ExportMetadata): void {
      document.commentBefore = Object.keys(metadata)
         .map(key => METADATA_PREFIX + key + ': ' + metadata[key])
         .join('\n');
   }

   protected parseMetadata(document: yaml.Document): ExportMetadata {
      const lines = document.commentBefore?.split('\n') ?? [];
      const metadata: ExportMetadata = { APPLICATION: 'unknown', ORIGIN: 'unknown', TIME: 'unknown' };
      for (const line of lines) {
         const firstDelimiter = line.indexOf(':');
         const key = line.substring(METADATA_PREFIX.length, firstDelimiter);
         const value = line.substring(firstDelimiter + 1).trim();
         metadata[key] = value;
      }
      return metadata;
   }

   //
   // IMPORT
   //

   protected findDirectoryToImport(uri: URI): URI | undefined {
      if (uri.path.ext.length) {
         // not a directory
         return;
      }
      if (this.modelService.systems.find(system => URI.fromFilePath(system.directory).isEqualOrParent(uri))) {
         return undefined;
      }
      return uri;
   }

   async importSystem(directory: URI): Promise<void> {
      if (!directory) {
         return;
      }
      const workspaceImport = directory === this.workspaceService.tryGetRoots()[0].resource;
      const selectedExport = await this.fileDialogService.showOpenDialog({
         title: workspaceImport ? 'Select System File to Import into Workspace' : 'Select System File to Import into Folder',
         canSelectFiles: true,
         openLabel: 'Import',
         filters: { 'All Files': [], 'System Export Files': [EXPORT_FILE_EXTENSION] }
      });
      if (!selectedExport) {
         return;
      }

      const progress = await this.messageService.showProgress({
         text: `Import ${selectedExport.path.name}...`,
         options: { timeout: 2000 }
      });

      try {
         let systemName = selectedExport.path.name;
         const systemContent = await this.fileService.read(selectedExport);

         const filesToWrite = new Map<string, string>();
         const documents = yaml.parseAllDocuments(systemContent.value);
         for (const document of documents) {
            const metadata = this.parseMetadata(document);
            this.removeMetadata(document);

            const origin = new Path(metadata.ORIGIN);
            if (origin.base === 'package.json') {
               // special handling for package.json as we do not want to store it as YAML
               const content = document.toJSON();
               systemName = content.name ?? systemName;
               filesToWrite.set(origin.base, JSON.stringify(content, undefined, 4));
            } else {
               const modelName = this.readModelId(document) ?? ModelFileExtensions.getName(origin.base);
               const modelContent = this.readModelContent(document);
               const modelType = ModelFileExtensions.detectFileType(modelContent) ?? ModelFileType.Generic;
               const modelExtension = ModelFileExtensions.getFileExtension(modelType) ?? origin.ext;
               const relativePath = this.subFolder(modelType) + modelName + modelExtension;
               filesToWrite.set(relativePath, modelContent);
            }
         }

         const systemDirectory = directory.resolve(systemName);
         if (await this.fileService.exists(systemDirectory)) {
            const wsRoot = this.workspaceService.getWorkspaceRootUri(directory);
            const location = wsRoot?.relative(directory)?.fsPath() ?? directory.path.fsPath();
            const overwrite = await new ConfirmDialog({
               title: 'System folder already exists',
               msg: `System folder '${systemName}' already exists at  '${location}'. Do you want to overwrite any content?`,
               ok: 'Overwrite',
               cancel: 'Abort Import'
            }).open();
            if (!overwrite) {
               // abort whole importing process
               return;
            }
         } else {
            await this.fileService.createFolder(systemDirectory);
         }
         for (const [relativePath, content] of filesToWrite) {
            await this.fileService.write(systemDirectory.resolve(relativePath), content);
         }
      } finally {
         progress.cancel();
      }
   }

   protected readModelId(document: yaml.Document): string | undefined {
      const contents = document.contents;
      if (!yaml.isMap(contents)) {
         return undefined;
      }
      // contents.items[0] is our root object
      // - key = 'entity', 'relationship', ...
      const rootObjProps = contents.items[0].value as yaml.YAMLMap<yaml.Scalar<string>, yaml.Scalar<string>>;
      if (!yaml.isMap(rootObjProps)) {
         return undefined;
      }
      const idEntry = rootObjProps.items.find(entry => entry.key.value === 'id');
      return idEntry?.value?.value;
   }

   protected readModelContent(document: yaml.Document): string {
      const content = document.toString();
      return content.endsWith(this.documentDelimiter()) ? content.substring(0, content.length - this.documentDelimiter().length) : content;
   }

   protected subFolder(modelType: ModelFileType): string {
      if (modelType === 'Entity') {
         return ModelStructure.Entity.FOLDER + '/';
      }
      if (modelType === 'Relationship') {
         return ModelStructure.Relationship.FOLDER + '/';
      }
      if (modelType === 'SystemDiagram') {
         return ModelStructure.SystemDiagram.FOLDER + '/';
      }
      if (modelType === 'Mapping') {
         return ModelStructure.Mapping.FOLDER + '/';
      }
      return '';
   }

   protected removeMetadata(document: yaml.Document): void {
      // eslint-disable-next-line no-null/no-null
      document.commentBefore = null;
   }
}
