/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { ModelService } from '@crossbreeze/model-service/lib/common';
import { ModelFileExtensions, ModelFileType, SystemInfo } from '@crossbreeze/protocol';
import {
   CancellationTokenSource,
   Command,
   CommandContribution,
   CommandRegistry,
   MenuContribution,
   MenuModelRegistry,
   MessageService,
   Path,
   SelectionService,
   URI,
   UriSelection,
   isArray
} from '@theia/core';
import { CommonMenus, ConfirmDialog, OpenerService, open } from '@theia/core/lib/browser';
import { FrontendApplicationConfigProvider } from '@theia/core/lib/browser/frontend-application-config-provider';
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

const EXPORT_YAML_SYSTEM: Command = {
   id: 'crossmodel.export.yaml',
   label: 'Export System'
};

const IMPORT_YAML_SYSTEM: Command = {
   id: 'crossmodel.import.yaml',
   label: 'Import System'
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

   registerCommands(commands: CommandRegistry): void {
      commands.registerCommand(EXPORT_YAML_SYSTEM, {
         execute: args => this.exportSystems(args),
         isVisible: () => this.workspaceService.tryGetRoots().length > 0
      });
      commands.registerCommand(IMPORT_YAML_SYSTEM, {
         execute: args => this.importYamlSystem(args),
         isVisible: () => this.workspaceService.tryGetRoots().length > 0
      });
   }

   registerMenus(menus: MenuModelRegistry): void {
      menus.registerSubmenu(FILE_IMPORT_EXPORT_SUBMENU, 'Import / Export', { order: 'c' });
      menus.registerMenuAction(FILE_IMPORT_EXPORT_SUBMENU, { commandId: IMPORT_YAML_SYSTEM.id, order: 'a' });
      menus.registerMenuAction(FILE_IMPORT_EXPORT_SUBMENU, { commandId: EXPORT_YAML_SYSTEM.id, order: 'b' });

      menus.registerMenuAction(NAV_DOWNLOAD_UPLOAD, { commandId: IMPORT_YAML_SYSTEM.id, order: 'b' });
      menus.registerMenuAction(NAV_DOWNLOAD_UPLOAD, { commandId: EXPORT_YAML_SYSTEM.id, order: 'bb' });
   }

   protected getArgUris(...args: any[]): URI[] | undefined {
      const [maybeUriArray] = args;
      if (isArray(maybeUriArray, uri => uri instanceof URI)) {
         return maybeUriArray as URI[];
      }
      if (maybeUriArray instanceof URI) {
         return [maybeUriArray];
      }
      return undefined;
   }

   protected getSelectedUris(): URI[] | undefined {
      const selectedUris = UriSelection.getUris(this.selectionService.selection);
      return selectedUris.length === 0 ? undefined : selectedUris;
   }

   //
   // EXPORT
   //

   protected getExportContext(...args: any[]): URI[] {
      return this.getArgUris(...args) ?? this.getSelectedUris() ?? this.workspaceService.tryGetRoots().map(root => root.resource);
   }

   async exportSystems(...args: any[]): Promise<void> {
      const uris = this.getExportContext();
      const systems = await this.getSystems(uris);
      if (systems.length === 0) {
         this.messageService.info(`Not part of a system: ${uris[0]}`, { timeout: 5000 });
         return;
      }

      return this.exportSystem(systems[0]);
   }

   protected async getSystems(uris: URI[]): Promise<SystemInfo[]> {
      const systems = await Promise.all(uris.map(uri => this.modelService.getSystemInfo({ contextUri: uri.toString() })));
      // filter down to distinct systems
      const seen = new Map<string, SystemInfo>();
      systems.forEach(system => {
         if (system && !seen.has(system?.packageFilePath)) {
            seen.set(system.packageFilePath, system);
         }
      });
      return Array.from(seen.values());
   }

   async exportSystem(system: SystemInfo): Promise<void> {
      const systemPackageUri = URI.fromFilePath(system.packageFilePath);
      const systemPackageContent = await this.fileService.read(systemPackageUri);
      const systemPackageJson = JSON.parse(systemPackageContent.value) as PackageJson;

      const systemDirectory = systemPackageUri.parent;
      // package name > directory name > default 'system'
      const systemName = systemPackageJson.name ?? systemDirectory.path.name ?? 'system';

      const saveDirectory = await this.fileService.resolve(systemPackageUri.parent);
      const exportFileUri = await this.fileDialogService.showSaveDialog(
         {
            title: `Export ${systemName} with ${system.modelFilePaths.length} files`,
            saveLabel: 'Export',
            inputValue: systemName + '.' + EXPORT_FILE_EXTENSION,
            filters: { 'System Export': [EXPORT_FILE_EXTENSION], 'All Files': ['*'] }
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
            text: `Export ${systemName} with ${system.modelFilePaths.length} files`,
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

   protected getImportContext(...args: any[]): URI[] {
      return this.getArgUris(...args) ?? this.getSelectedUris() ?? [];
   }

   async importYamlSystem(...args: any[]): Promise<void> {
      let selectedExport = this.getImportContext(args).find(uri => uri.path.ext === '.' + EXPORT_FILE_EXTENSION);
      if (!selectedExport) {
         selectedExport = await this.fileDialogService.showOpenDialog({
            title: 'Import System',
            canSelectFiles: true,
            openLabel: 'Import',
            filters: { 'System Export': [EXPORT_FILE_EXTENSION], 'All Files': ['*'] }
         });
      }
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

         const root = this.workspaceService.getWorkspaceRootUri(selectedExport) ?? this.workspaceService.tryGetRoots()[0]?.resource;
         const systemDirectory = root.resolve(systemName);
         if (await this.fileService.exists(systemDirectory)) {
            const overwrite = await new ConfirmDialog({
               title: 'Folder already exists',
               msg: `Folder '${systemName}' already exists on root level. Do you want to overwrite any content?`,
               ok: 'Overwrite'
            }).open();
            if (!overwrite) {
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
         return 'entities/';
      }
      if (modelType === 'Relationship') {
         return 'relationships/';
      }
      if (modelType === 'SystemDiagram') {
         return 'diagram/';
      }
      if (modelType === 'Mapping') {
         return 'mappings/';
      }
      return '';
   }

   protected removeMetadata(document: yaml.Document): void {
      // eslint-disable-next-line no-null/no-null
      document.commentBefore = null;
   }
}
