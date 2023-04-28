/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { DefaultLangiumDocuments } from 'langium';
import { URI } from 'vscode-uri';
import { isPackageUri } from './cross-model-package-manager';
import { Utils } from './util/uri-util';

export class CrossModelLangiumDocuments extends DefaultLangiumDocuments {
   override getOrCreateDocument(uri: URI): any {
      // only create documents for actual language files but not for package.json
      return isPackageUri(uri) ? undefined : super.getOrCreateDocument(Utils.toRealURI(uri));
   }
}
