/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelSelectionData } from '@crossbreeze/glsp-client/lib/browser/crossmodel-selection-data-service';
import { ModelService } from '@crossbreeze/model-service/lib/common';
import { ResolvedElement } from '@crossbreeze/protocol';
import { GlspSelection } from '@eclipse-glsp/theia-integration';
import { inject, injectable } from '@theia/core/shared/inversify';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';

export const PROPERTY_CLIENT_ID = 'property-view-client';

@injectable()
export class ModelDataService implements PropertyDataService {
   id = 'model-property-data-service';
   label = 'ModelPropertyDataService';

   @inject(ModelService) protected modelService: ModelService;

   canHandleSelection(selection: GlspSelection | undefined): number {
      return GlspSelection.is(selection) ? 1 : 0;
   }

   protected async getSelectedEntity(selection: GlspSelection | undefined): Promise<ResolvedElement | undefined> {
      if (!selection || !GlspSelection.is(selection) || !selection.sourceUri || selection.selectedElementsIDs.length === 0) {
         return undefined;
      }
      const dataMap = selection.additionalSelectionData as CrossModelSelectionData;
      for (const selectedElementId of selection.selectedElementsIDs) {
         const info = dataMap?.selectionDataMap.get(selectedElementId);
         if (info?.reference) {
            return this.modelService.resolveReference(info?.reference);
         }
      }
      return undefined;
   }

   async providePropertyData(selection: GlspSelection | undefined): Promise<ResolvedElement | undefined> {
      return this.getSelectedEntity(selection);
   }
}
