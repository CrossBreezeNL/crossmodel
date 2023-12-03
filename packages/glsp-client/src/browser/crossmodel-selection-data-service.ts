/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { GModelElement, GModelRoot } from '@eclipse-glsp/client';
import { GlspSelectionData } from '@eclipse-glsp/theia-integration';
import { isDefined } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { CrossModelSelectionDataService } from './crossmodel-selection-forwarder';

@injectable()
export class CrossModelGLSPSelectionDataService extends CrossModelSelectionDataService {
   async getSelectionData(root: Readonly<GModelRoot>, selectedElementIds: string[]): Promise<GlspSelectionData> {
      return getSelectionDataFor(selectedElementIds.map(id => root.index.getById(id)).filter(isDefined));
   }
}

export function getSelectionDataFor(selection: GModelElement[]): GlspSelectionData {
   const selectionDataMap = new Map<string, string>();
   selection.forEach(element => selectionDataMap.set(element.id, element.type));
   return { selectionDataMap };
}
