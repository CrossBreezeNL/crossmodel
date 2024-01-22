/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ModelService } from '@crossbreeze/model-service/lib/common';
import { DiagramNodeEntity, ENTITY_NODE_TYPE } from '@crossbreeze/protocol';
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

   protected async getSelectedEntity(selection: GlspSelection | undefined): Promise<DiagramNodeEntity | undefined> {
      if (!selection || !GlspSelection.is(selection) || !selection.sourceUri || selection.selectedElementsIDs.length === 0) {
         return undefined;
      }
      for (const selectedElementId of selection.selectedElementsIDs) {
         if (selection.additionalSelectionData?.selectionDataMap.get(selectedElementId) === ENTITY_NODE_TYPE) {
            return this.modelService.requestDiagramNodeEntityModel(selection.sourceUri, selectedElementId);
         }
      }
      return undefined;
   }

   async providePropertyData(selection: GlspSelection | undefined): Promise<DiagramNodeEntity | undefined> {
      return this.getSelectedEntity(selection);
   }
}
