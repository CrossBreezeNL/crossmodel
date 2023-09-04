/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ModelService } from '@crossbreeze/model-service/lib/common';
import { DiagramNodeEntity } from '@crossbreeze/protocol';
import { GlspSelection } from '@eclipse-glsp/theia-integration';
import { inject, injectable } from '@theia/core/shared/inversify';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';
@injectable()
export class ModelDataService implements PropertyDataService {
    id = 'model-property-data-service';
    label = 'ModelPropertyDataService';
    currentUri: string;

    @inject(ModelService) protected modelService: ModelService;

    canHandleSelection(selection: GlspSelection | undefined): number {
        const canHandle = GlspSelection.is(selection) ? 1 : 0;

        // Close the previous file if there is a new selection the property view can not handle
        if (canHandle === 0 && this.currentUri !== '') {
            this.modelService.close(this.currentUri);
        }

        return canHandle;
    }

    async providePropertyData(selection: GlspSelection | undefined): Promise<DiagramNodeEntity | undefined> {
        if (selection && GlspSelection.is(selection) && selection.sourceUri && selection.selectedElementsIDs.length !== 0) {
            const entity: DiagramNodeEntity | undefined = await this.modelService.requestDiagramNodeEntityModel(
                selection.sourceUri,
                selection.selectedElementsIDs[0]
            );

            if (entity) {
                if (this.currentUri && this.currentUri !== entity.uri) {
                    await this.modelService.close(this.currentUri);
                    this.currentUri = entity.uri;
                    await this.modelService.open(this.currentUri);
                }

                return entity;
            }
        }

        return undefined;
    }
}
