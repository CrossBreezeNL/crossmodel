/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { GModelRoot, ISelectionListener } from '@eclipse-glsp/client';
import { GlspSelectionData, GlspSelectionDataService } from '@eclipse-glsp/theia-integration';
import { isDefined } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class CrossModelGLSPSelectionDataService extends GlspSelectionDataService implements ISelectionListener {
   protected root?: Readonly<GModelRoot>;

   selectionChanged(root: Readonly<GModelRoot>, selectedElements: string[], deselectedElements?: string[] | undefined): void {
      this.root = root;
   }

   async getSelectionData(selectedElementIds: string[]): Promise<GlspSelectionData> {
      const selectionDataMap = new Map<string, string>();
      selectedElementIds
         .map(elementId => this.root?.index.getById(elementId))
         .filter(isDefined)
         .forEach(element => selectionDataMap.set(element.id, element.type));
      return { selectionDataMap };
   }
}
