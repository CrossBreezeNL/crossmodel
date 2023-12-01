/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ENTITY_NODE_TYPE } from '@crossbreeze/glsp-client/lib/browser/model';
import { ModelService } from '@crossbreeze/model-service/lib/common';
import { CrossModelRoot, DiagramNodeEntity } from '@crossbreeze/protocol';
import { GlspSelection } from '@eclipse-glsp/theia-integration';
import { inject, injectable } from '@theia/core/shared/inversify';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';

export const PROPERTY_CLIENT_ID = 'property-view-client';

@injectable()
export class ModelDataService implements PropertyDataService {
   id = 'model-property-data-service';
   label = 'ModelPropertyDataService';
   currentUri?: string;

   @inject(ModelService) protected modelService: ModelService;

   canHandleSelection(selection: GlspSelection | undefined): number {
      const canHandle = GlspSelection.is(selection) ? 1 : 0;

      // Close the previous file if there is a new selection the property view can not handle
      if (canHandle === 0 && this.currentUri) {
         this.modelService.close({ uri: this.currentUri, clientId: PROPERTY_CLIENT_ID });
      }

      return canHandle;
   }

   protected async closeCurrentModel(): Promise<void> {
      if (this.currentUri) {
         return this.modelService.close({ uri: this.currentUri, clientId: PROPERTY_CLIENT_ID });
      }
      this.currentUri = undefined;
   }

   protected async openCurrentModel(): Promise<CrossModelRoot | undefined> {
      if (this.currentUri) {
         return this.modelService.open({ uri: this.currentUri, clientId: PROPERTY_CLIENT_ID });
      }
      return undefined;
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
      const entity = await this.getSelectedEntity(selection);
      if (!entity) {
         this.closeCurrentModel();
         return undefined;
      }
      const newUri = entity.uri;
      if (newUri !== this.currentUri) {
         await this.closeCurrentModel();
      }
      this.currentUri = newUri;
      await this.openCurrentModel();
      return entity;
   }
}
