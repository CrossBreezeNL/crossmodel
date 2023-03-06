/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { DocumentState, LangiumDocument, MultiMap } from 'langium';
// eslint-disable-next-line import/no-unresolved
import { PackageJson } from 'type-fest';
import { CancellationToken, WorkspaceFolder } from 'vscode-languageserver';
import { URI, Utils as UriUtils } from 'vscode-uri';
import { CrossModelSharedServices } from './cross-model-module';
import { Utils } from './util/uri-util';

export const UNKNOWN_PROJECT_ID = 'unknown';
export const UNKNOWN_PROJECT_REFERENCE = 'unknown';

export function isPackageUri(uri: URI): boolean {
   return UriUtils.basename(uri) === 'package.json';
}

export function isPackageLockUri(uri: URI): boolean {
   return UriUtils.basename(uri).endsWith('package-lock.json');
}

export function createPackageId(name?: string, version = '0.0.0'): string {
   return name === undefined ? UNKNOWN_PROJECT_ID : name + '@' + version;
}

export function createPackageReferenceName(packageJson?: PackageJson): string {
   // we prefer the our custom-introduced alias if it is specified, otherwise we will fall back on the package name
   // we do not care about the package version as we do not allow to install multiple versions of the same package
   const name = (packageJson?.['alias'] as string | undefined) || packageJson?.name || UNKNOWN_PROJECT_ID;
   // ensure we only have characters that are supported by our ID rule in the grammar and still look good to the user
   return name.split(' ').join('_').split('.').join('-');
}

export function isUnknownPackage(packageId: string): boolean {
   return packageId === UNKNOWN_PROJECT_ID;
}

export class PackageInfo {
   constructor(
      readonly uri: URI,
      readonly packageJson?: PackageJson,
      readonly directory: URI = UriUtils.dirname(uri),
      readonly id = createPackageId(packageJson?.name, packageJson?.version),
      readonly referenceName = createPackageReferenceName(packageJson),
      readonly dependencies = Object.entries(packageJson?.dependencies || {}).map(dep => createPackageId(dep[0], dep[1]))
   ) {}

   isUnknown(): boolean {
      return isUnknownPackage(this.id);
   }
}

export class CrossModelPackageManager {
   protected uriToPackage = new Map<string, PackageInfo>();
   protected idToPackage = new MultiMap<string, PackageInfo>();

   constructor(
      protected shared: CrossModelSharedServices,
      protected fileSystemProvider = shared.workspace.FileSystemProvider,
      protected textDocuments = shared.workspace.TextDocuments,
      protected langiumDocuments = shared.workspace.LangiumDocuments,
      protected documentBuilder = shared.workspace.DocumentBuilder,
      protected logger = shared.logger.ClientLogger
   ) {
      this.documentBuilder.onUpdate((changed, deleted) => this.onBuildUpdate(changed, deleted));
      this.documentBuilder.onBuildPhase(DocumentState.Parsed, (docs, token) => this.documentParsed(docs, token));
   }

   async initialize(folders: WorkspaceFolder[]): Promise<void> {
      const initializations: Promise<void>[] = [];
      for (const folder of folders) {
         initializations.push(this.initializePackages(URI.parse(folder.uri)));
      }
      await Promise.all(initializations);
   }

   protected async initializePackages(folderPath: URI): Promise<void> {
      const content = await this.fileSystemProvider.readDirectory(folderPath);
      await Promise.all(
         content.map(async entry => {
            if (entry.isDirectory) {
               await this.initializePackages(entry.uri);
            } else if (entry.isFile && isPackageUri(entry.uri)) {
               const text = this.fileSystemProvider.readFileSync(entry.uri);
               this.updatePackage(entry.uri, text);
            }
         })
      );
   }

   getPackageIdByUri(uri?: URI): string {
      return this.getPackageInfoByURI(uri)?.id || UNKNOWN_PROJECT_ID;
   }

   getPackageIdByDocument(doc: LangiumDocument): string {
      return this.getPackageInfoByDocument(doc)?.id || UNKNOWN_PROJECT_ID;
   }

   getPackageInfoByDocument(doc: LangiumDocument): PackageInfo | undefined {
      const packageUri = (doc as any)['packageUri'] as URI | undefined;
      return this.getPackageInfoByURI(packageUri ?? doc.uri);
   }

   getPackageInfoByURI(uri?: URI): PackageInfo | undefined {
      if (!uri) {
         return;
      }

      const packageInfo = this.uriToPackage.get(uri.toString());
      if (packageInfo) {
         return packageInfo;
      }

      // we prefer longer path names as we are deeper in the nested hierarchy
      const packageInfos = [...this.uriToPackage.values()]
         .filter(info => Utils.isChildOf(info.directory, uri))
         .sort((left, right) => right.directory.fsPath.length - left.directory.fsPath.length);

      return packageInfos[0];
   }

   isVisible(sourcePackageId: string, targetPackageId: string): boolean {
      return !isUnknownPackage(sourcePackageId) && this.getVisiblePackageIds(sourcePackageId).includes(targetPackageId);
   }

   protected getAllDependencies(packageId: string): string[] {
      return this.idToPackage.get(packageId).flatMap(info => info.dependencies);
   }

   protected getVisiblePackageIds(sourcePackage: string, includeSource = false, visited: string[] = []): string[] {
      if (visited.includes(sourcePackage)) {
         return [];
      }
      visited.push(sourcePackage);
      const visible = includeSource ? [sourcePackage] : [];
      this.getAllDependencies(sourcePackage).forEach(dependency => visible.push(...this.getVisiblePackageIds(dependency, true, visited)));
      return visible;
   }

   protected onBuildUpdate(changed: URI[], deleted: URI[]): void {
      // convert 'package.json' updates to document updates
      // - remove 'package.json' updates and track necessary changes
      // - build all text documents that are within updated packages

      const affectedPackages: string[] = [];
      const changedPackages = getAndRemovePackageUris(changed);
      for (const changedPackage of changedPackages) {
         affectedPackages.push(...this.updatePackage(changedPackage));
      }
      const deletedPackages = getAndRemovePackageUris(deleted);
      for (const deletedPackage of deletedPackages) {
         affectedPackages.push(...this.deletePackage(deletedPackage));
      }

      if (affectedPackages.length > 0) {
         // add transitive affected packages
         this.idToPackage
            .values()
            .filter(info => affectedPackages.some(affected => info.dependencies.includes(affected)))
            .forEach(info => affectedPackages.push(info.id));

         this.langiumDocuments.all
            .filter(doc => affectedPackages.includes(this.getPackageIdByDocument(doc)))
            .forEach(doc => {
               this.langiumDocuments.invalidateDocument(doc.uri);
               changed.push(doc.uri);
            });
      }
   }

   protected addPackage(uri: URI, packageJson: PackageJson): string[] {
      const packageInfo = new PackageInfo(uri, packageJson);
      if (!packageInfo.isUnknown()) {
         this.uriToPackage.set(packageInfo.uri.toString(), packageInfo);

         // remove existing entry if there is already one for this package
         const existing = this.idToPackage.get(packageInfo.id).find(info => info.uri.toString() === uri.toString());
         if (existing) {
            this.idToPackage.delete(packageInfo.id, existing);
         }

         // warn if other package with same ID (but different URI) is registered
         const sameId = this.idToPackage.get(packageInfo.id).find(info => info.uri.toString() !== uri.toString());
         if (sameId) {
            this.logger.warn('A package with the same id was already registered.');
         }
         this.idToPackage.add(packageInfo.id, packageInfo);
         return [packageInfo.id];
      }
      return [];
   }

   protected deletePackage(uri: URI): string[] {
      const packageInfo = this.uriToPackage.get(uri.toString());
      if (packageInfo && !packageInfo?.isUnknown()) {
         this.uriToPackage.delete(uri.toString());
         this.idToPackage.delete(packageInfo.id, packageInfo);
         return [packageInfo.id];
      }
      return [];
   }

   protected updatePackage(uri: URI, text = this.shared.workspace.TextDocuments.get(uri.toString())?.getText()): string[] {
      const newPackageJson = parsePackageJson(text || Utils.readFile(uri));
      if (!newPackageJson) {
         return [];
      }

      const toUpdate = [];
      const existingPackageInfo = this.uriToPackage.get(uri.toString());
      const newPackageId = createPackageId(newPackageJson.name, newPackageJson.version);
      if (existingPackageInfo && existingPackageInfo?.id !== newPackageId) {
         toUpdate.push(...this.deletePackage(uri));
      }
      toUpdate.push(...this.addPackage(uri, newPackageJson));
      return toUpdate;
   }

   protected documentParsed(built: LangiumDocument[], _cancelToken: CancellationToken): void {
      // we only do this so we can quickly find the package info for a given document
      for (const doc of built) {
         (doc as any)['packageUri'] = this.getPackageInfoByURI(doc.uri)?.uri;
      }
   }
}

function getAndRemovePackageUris(uris: URI[]): URI[] {
   const packages: URI[] = [];
   uris.forEach((uri, idx) => {
      if (isPackageUri(uri)) {
         packages.push(...uris.splice(idx, 1));
      } else if (isPackageLockUri(uri)) {
         uris.splice(idx, 1);
      }
   });
   return packages;
}

function parsePackageJson(text?: string): PackageJson | undefined {
   if (!text) {
      return;
   }
   try {
      return JSON.parse(text) as PackageJson;
   } catch (error) {
      return undefined;
   }
}
