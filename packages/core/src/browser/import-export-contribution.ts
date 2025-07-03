/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { ModelService } from '@crossmodel/model-service/lib/common';
import { DataModelInfo, ModelFileExtensions, ModelFileType, ModelStructure } from '@crossmodel/protocol';
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
import * as yaml from 'yaml';

const FILE_DOWNLOAD_UPLOAD = [...CommonMenus.FILE, '4_downloadupload'];
const FILE_IMPORT_EXPORT_SUBMENU = [...FILE_DOWNLOAD_UPLOAD, '1_import_export'];

const NAV_DOWNLOAD_UPLOAD = [...NAVIGATOR_CONTEXT_MENU, '6_downloadupload'];

const EXPORT_YAML_DATAMODEL_NAV: Command = {
   id: 'crossmodel.export.yaml.nav',
   label: 'Export Data Model to File'
};

const EXPORT_YAML_DATAMODEL_FILE: Command = {
   id: 'crossmodel.export.yaml.file',
   label: 'Export Data Model to File'
};

const IMPORT_YAML_DATAMODEL_NAV: Command = {
   id: 'crossmodel.import.yaml.nav',
   label: 'Import Data Model from File'
};

const IMPORT_YAML_DATAMODEL_FILE: Command = {
   id: 'crossmodel.import.yaml.file',
   label: 'Import Data Model from File'
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
      commands.registerCommand(EXPORT_YAML_DATAMODEL_FILE, {
         execute: async () => this.exportDataModel(await this.queryDataModelFromUser()),
         isVisible: () => this.modelService.dataModels.length > 0
      });
      commands.registerCommand(IMPORT_YAML_DATAMODEL_FILE, {
         execute: () => this.importDataModel(this.workspaceService.tryGetRoots()[0].resource),
         isVisible: () => this.workspaceService.tryGetRoots().length > 0
      });

      // Navigator commands (consider selected elements in the tree)
      commands.registerCommand(
         EXPORT_YAML_DATAMODEL_NAV,
         UriAwareCommandHandler.MonoSelect(this.selectionService, {
            execute: uri => this.exportDataModel(this.findDataModelToExport(uri)),
            isVisible: uri => !!this.findDataModelToExport(uri)
         })
      );
      commands.registerCommand(
         IMPORT_YAML_DATAMODEL_NAV,
         UriAwareCommandHandler.MonoSelect(this.selectionService, {
            execute: uri => this.importDataModel(this.findDirectoryToImport(uri)!),
            isVisible: uri => !!this.findDirectoryToImport(uri)
         })
      );
   }

   registerMenus(menus: MenuModelRegistry): void {
      menus.registerSubmenu(FILE_IMPORT_EXPORT_SUBMENU, 'Import / Export', { order: 'c' });
      menus.registerMenuAction(FILE_IMPORT_EXPORT_SUBMENU, { commandId: IMPORT_YAML_DATAMODEL_FILE.id, order: 'a' });
      menus.registerMenuAction(FILE_IMPORT_EXPORT_SUBMENU, { commandId: EXPORT_YAML_DATAMODEL_FILE.id, order: 'b' });

      menus.registerMenuAction(NAV_DOWNLOAD_UPLOAD, { commandId: IMPORT_YAML_DATAMODEL_NAV.id, order: 'b' });
      menus.registerMenuAction(NAV_DOWNLOAD_UPLOAD, { commandId: EXPORT_YAML_DATAMODEL_NAV.id, order: 'bb' });
   }

   //
   // EXPORT
   //

   protected findDataModelToExport(uri: URI): DataModelInfo | undefined {
      const contextPath = uri.path.fsPath();
      return this.modelService.dataModels.find(dataModel => dataModel.directory === contextPath);
   }

   protected async queryDataModelFromUser(): Promise<DataModelInfo | undefined> {
      if (this.modelService.dataModels.length === 0) {
         return undefined;
      }
      const dataModelPick = await this.quickPick.show(this.modelService.dataModels.map(dataModel => this.toQuickPickItem(dataModel)));
      return dataModelPick?.dataModel;
   }

   protected toQuickPickItem(dataModel: DataModelInfo): QuickPickItem & { dataModel: DataModelInfo } {
      const directory = URI.fromFilePath(dataModel.directory);
      const wsRoot = this.workspaceService.getWorkspaceRootUri(directory);
      const location = wsRoot?.relative(directory)?.fsPath() ?? directory.path.fsPath();
      return { label: dataModel.name, description: dataModel.id, detail: location, dataModel };
   }

   async exportDataModel(context?: DataModelInfo): Promise<void> {
      if (!context) {
         return;
      }

      const dataModel = await this.modelService.getDataModelInfo({ contextUri: context.dataModelFilePath });
      if (!dataModel) {
         this.messageService.error('Could not find data model for ' + context.directory);
         return;
      }
      const dataModelFileUri = URI.fromFilePath(dataModel.dataModelFilePath);
      const dataModelDirectory = URI.fromFilePath(dataModel.directory);

      const saveUri = this.workspaceService.getWorkspaceRootUri(dataModelFileUri) ?? dataModelFileUri.parent;
      const saveDirectory = await this.fileService.resolve(saveUri);
      const exportFileUri = await this.fileDialogService.showSaveDialog(
         {
            title: `Export ${dataModel.name} to File`,
            saveLabel: 'Export',
            inputValue: dataModel.name + '.' + EXPORT_FILE_EXTENSION,
            filters: { ['Data Model Export Files (*.' + EXPORT_FILE_EXTENSION + ')']: [EXPORT_FILE_EXTENSION], 'All Files': [] }
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
            text: `Export ${dataModel.name} with ${dataModel.modelFilePaths.length + 1} files`,
            options: { cancelable: true, timeout: 2000 }
         },
         () => cancel.cancel()
      );

      const totalWork = dataModel.modelFilePaths.length + 2; // +1 for datamodel.cm document, +1 for writing result
      const documents: yaml.Document[] = [];

      try {
         // First, add the datamodel.cm file
         progress.report({ message: dataModel.dataModelFilePath, work: { done: 0, total: totalWork } });
         const dataModelContent = await this.fileService.read(dataModelFileUri);
         const dataModelDocument = yaml.parseDocument(dataModelContent.value);
         this.addMetadata(dataModelDocument, {
            APPLICATION: FrontendApplicationConfigProvider.get().applicationName,
            TIME: time,
            ORIGIN: dataModelFileUri.path.base
         });
         documents.push(dataModelDocument);

         for (const [idx, modelFilePath] of dataModel.modelFilePaths.entries()) {
            if (cancel.token.isCancellationRequested) {
               return;
            }
            const modelFileUri = URI.fromFilePath(modelFilePath);
            const dataModelRelativePath = dataModelDirectory.relative(modelFileUri);
            const modelPath = dataModelRelativePath?.toString() ?? modelFilePath;

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
         const dataModelYaml = documents.map(doc => doc.toString()).join(this.documentDelimiter());
         await this.fileService.write(exportFileUri, dataModelYaml);

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
      if (this.modelService.dataModels.find(dataModel => URI.fromFilePath(dataModel.directory).isEqualOrParent(uri))) {
         return undefined;
      }
      return uri;
   }

   async importDataModel(directory: URI): Promise<void> {
      if (!directory) {
         return;
      }
      const workspaceImport = directory === this.workspaceService.tryGetRoots()[0].resource;
      const selectedExport = await this.fileDialogService.showOpenDialog({
         title: workspaceImport ? 'Select Data Model File to Import into Workspace' : 'Select Data Model File to Import into Folder',
         canSelectFiles: true,
         openLabel: 'Import',
         filters: { ['Data Model Export Files (*.' + EXPORT_FILE_EXTENSION + ')']: [EXPORT_FILE_EXTENSION], 'All Files': [] }
      });
      if (!selectedExport) {
         return;
      }

      const progress = await this.messageService.showProgress({
         text: `Import ${selectedExport.path.name}...`,
         options: { timeout: 2000 }
      });

      try {
         let dataModelName = selectedExport.path.name;
         const exportContent = await this.fileService.read(selectedExport);

         const filesToWrite = new Map<string, string>();
         const documents = yaml.parseAllDocuments(exportContent.value);
         for (const document of documents) {
            const metadata = this.parseMetadata(document);
            this.removeMetadata(document);

            const origin = new Path(metadata.ORIGIN);
            if (origin.base === 'datamodel.cm') {
               // Handle datamodel.cm file
               const content = document.toJSON();
               dataModelName = content.datamodel?.name ?? dataModelName;
               filesToWrite.set(origin.base, this.readModelContent(document));
            } else {
               const modelName = this.readModelId(document) ?? ModelFileExtensions.getName(origin.base);
               const modelContent = this.readModelContent(document);
               const modelType = ModelFileExtensions.detectFileType(modelContent) ?? ModelFileType.Generic;
               const modelExtension = ModelFileType.getFileExtension(modelType) ?? origin.ext;
               const relativePath = this.subFolder(modelType) + modelName + modelExtension;
               filesToWrite.set(relativePath, modelContent);
            }
         }

         const dataModelDirectory = directory.resolve(dataModelName);
         if (await this.fileService.exists(dataModelDirectory)) {
            const wsRoot = this.workspaceService.getWorkspaceRootUri(directory);
            const location = wsRoot?.relative(directory)?.fsPath() ?? directory.path.fsPath();
            const overwrite = await new ConfirmDialog({
               title: 'Data Model folder already exists',
               msg: `Data Model folder '${dataModelName}' already exists at  '${location}'. Do you want to overwrite any content?`,
               ok: 'Overwrite',
               cancel: 'Abort Import'
            }).open();
            if (!overwrite) {
               // abort whole importing process
               return;
            }
         } else {
            await this.fileService.createFolder(dataModelDirectory);
         }
         for (const [relativePath, content] of filesToWrite) {
            await this.fileService.write(dataModelDirectory.resolve(relativePath), content);
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
      if (modelType === 'LogicalEntity') {
         return ModelStructure.LogicalEntity.FOLDER + '/';
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
      return ''; // Generic files (including datamodel.cm) go in the root directory
   }

   protected removeMetadata(document: yaml.Document): void {
      // eslint-disable-next-line no-null/no-null
      document.commentBefore = null;
   }
}
