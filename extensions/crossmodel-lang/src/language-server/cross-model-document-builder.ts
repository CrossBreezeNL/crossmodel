/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { DefaultDocumentBuilder } from 'langium';
import { CancellationToken } from 'vscode-languageclient';
import { URI, Utils as UriUtils } from 'vscode-uri';
import { CrossModelSharedServices } from './cross-model-module.js';
import { isPackageUri } from './cross-model-package-manager.js';
import { Utils } from './util/uri-util.js';

/**
 * A document builder that can also handle directories by flattening out directories to an array of file URIs.
 */
export class CrossModelDocumentBuilder extends DefaultDocumentBuilder {
   protected languageFileExtensions: string[] = [];

   constructor(protected services: CrossModelSharedServices) {
      super(services);
      this.languageFileExtensions = this.serviceRegistry.all.flatMap(service => service.LanguageMetaData.fileExtensions);
   }

   override update(changed: URI[], deleted: URI[], cancelToken?: CancellationToken | undefined): Promise<void> {
      return super.update(
         changed.flatMap(uri => this.flattenAndAdaptURI(uri)),
         deleted.flatMap(uri => this.collectDeletedURIs(uri)),
         cancelToken
      );
   }

   protected flattenAndAdaptURI(uri: URI): URI[] {
      try {
         return Utils.flatten(Utils.toRealURIorUndefined(uri)).filter(child => this.isLanguageFile(child));
      } catch (error) {
         return [uri];
      }
   }

   protected isLanguageFile(uri: URI): boolean {
      return this.languageFileExtensions.includes(UriUtils.extname(uri)) || isPackageUri(uri);
   }

   protected collectDeletedURIs(uri: URI): URI[] {
      const ext = UriUtils.extname(uri);
      if (ext) {
         return [uri];
      }
      // potential directory delete
      const dirPath = uri.path + '/';
      const deletedDocuments = this.langiumDocuments.all
         .filter(doc => doc.uri.path.startsWith(dirPath))
         .map(doc => doc.uri)
         .toArray();
      const deletedPackages = this.services.workspace.PackageManager.getPackageInfos()
         .filter(info => Utils.isChildOf(uri, info.uri))
         .map(info => info.uri);
      return [...deletedDocuments, ...deletedPackages, uri];
   }
}
