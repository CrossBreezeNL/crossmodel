/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as fs from 'fs';
import * as nodePath from 'path';
import { URI, Utils as UriUtils } from 'vscode-uri';

const posixPath = nodePath.posix || nodePath;

export namespace Utils {
   export function isChildOf(parent: URI, child: URI): boolean {
      const relative = posixPath.relative(parent.fsPath, child.fsPath);
      return !!relative && !relative.startsWith('..') && !posixPath.isAbsolute(relative);
   }

   export function matchSameFolder(folderProvider: (uri?: URI) => URI | undefined, ...uris: URI[]): boolean {
      if (uris.length < 2) {
         return true;
      }
      const [first, ...rest] = uris;
      const folder = folderProvider(first);
      return rest.every(uri => folderProvider(uri)?.fsPath === folder?.fsPath);
   }

   export function findNewUri(uri: URI): URI {
      if (!exists(uri)) {
         return uri;
      }
      let newUri = uri;
      const dirName = UriUtils.dirname(newUri);
      const baseName = UriUtils.basename(uri);
      const [base, ...extensions] = baseName.split('.');
      const extension = extensions.join('.');
      let counter = 0;
      do {
         newUri = UriUtils.joinPath(dirName, base + counter++ + '.' + extension);
      } while (exists(newUri));
      return newUri;
   }

   export function exists(uri: URI): boolean {
      return fs.existsSync(uri.fsPath);
   }

   export function toRealURI(uri: URI): URI {
      return URI.file(fs.realpathSync(uri.fsPath));
   }

   export function isDirectory(uri: URI): boolean | undefined {
      try {
         return fs.lstatSync(uri.fsPath).isDirectory();
      } catch (error) {
         return undefined;
      }
   }

   export function isFile(uri: URI): boolean {
      return !isDirectory(uri);
   }

   export function flatten(uri: URI): URI[] {
      return isFile(uri) ? [uri] : fs.readdirSync(uri.fsPath).flatMap(child => flatten(UriUtils.resolvePath(uri, child)));
   }

   export function readFile(uri: URI): string {
      return fs.readFileSync(uri.fsPath, 'utf8');
   }
}
