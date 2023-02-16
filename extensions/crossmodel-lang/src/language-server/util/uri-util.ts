/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as nodePath from 'path';
import { URI } from 'vscode-uri';

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
}
