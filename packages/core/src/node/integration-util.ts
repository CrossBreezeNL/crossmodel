/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { Deferred } from '@theia/core/lib/common/promise-util';
import * as fs from 'fs';

export function waitForTemporaryFileContent(file: string, timeout = 500, tries = -1): Promise<string> {
   const pendingContent = new Deferred<string>();
   let counter = 0;
   const tryReadingFile = (): void => {
      setTimeout(() => {
         try {
            const content = fs.readFileSync(file, 'utf8');
            fs.rmSync(file);
            pendingContent.resolve(content);
         } catch (error) {
            counter++;
            if (tries >= 0 && counter > tries) {
               pendingContent.reject(error);
            } else {
               tryReadingFile();
            }
         }
      }, timeout);
   };
   tryReadingFile();
   return pendingContent.promise;
}
