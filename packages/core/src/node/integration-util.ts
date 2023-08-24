/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { Deferred } from '@theia/core/lib/common/promise-util';
import * as fs from 'fs';

/**
 * Waits for a file to be created and deletes it as soon as it reads it.
 *
 * @param file file we want to read
 * @param timeout timeout between read attempts
 * @param attempts maximum number of attempts we try to read the file, -1 means infinite tries
 * @returns the content of the temporary file as string
 */
export function waitForTemporaryFileContent(file: string, timeout = 500, attempts = -1): Promise<string> {
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
            if (attempts >= 0 && counter > attempts) {
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
