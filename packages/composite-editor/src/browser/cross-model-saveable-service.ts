/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/

import { MaybePromise, URI } from '@theia/core';
import { Navigatable, SaveableSource, SaveOptions, Widget } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';
import { FilesystemSaveableService } from '@theia/filesystem/lib/browser/filesystem-saveable-service';

export interface DefaultSaveAsSaveableSource extends SaveableSource {
   getSaveAsUri(): MaybePromise<URI | undefined>;
}

export namespace DefaultSaveAsSaveableSource {
   export function is(candidate: SaveableSource): candidate is DefaultSaveAsSaveableSource {
      return 'getSaveAsUri' in candidate && typeof candidate.getSaveAsUri === 'function';
   }
}

@injectable()
export class CrossModelSaveableService extends FilesystemSaveableService {
   override async saveAs(sourceWidget: Widget & SaveableSource & Navigatable, options?: SaveOptions | undefined): Promise<URI | undefined> {
      const defaultSaveAsUri = DefaultSaveAsSaveableSource.is(sourceWidget) && (await sourceWidget.getSaveAsUri());
      if (defaultSaveAsUri && !(await this.fileService.exists(defaultSaveAsUri))) {
         try {
            await this.saveSnapshot(sourceWidget, defaultSaveAsUri, false);
            return defaultSaveAsUri;
         } catch (e) {
            console.warn(e);
         }
      }
      return super.saveAs(sourceWidget, options);
   }
}
