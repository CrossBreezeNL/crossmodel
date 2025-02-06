/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/

import { URI } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { FileResourceResolver } from '@theia/filesystem/lib/browser';

@injectable()
export class CrossModelFileResourceResolver extends FileResourceResolver {
   protected _autoOverwrite = false;

   get autoOverwrite(): boolean {
      return this._autoOverwrite;
   }

   set autoOverwrite(value: boolean) {
      this._autoOverwrite = value;
   }

   protected override async shouldOverwrite(uri: URI): Promise<boolean> {
      if (this.autoOverwrite) {
         return true;
      }
      // default: ask user via dialog whether they want to overwrite the file content
      return super.shouldOverwrite(uri);
   }
}
