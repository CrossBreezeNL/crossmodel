/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { inject, injectable } from '@theia/core/shared/inversify';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';
import { GlspSelection, isGlspSelection } from '@eclipse-glsp/theia-integration';
import { CrossModelRoot, DiagramNodeEntity, ModelService } from '@crossbreeze/model-service';

@injectable()
export class ModelDataService implements PropertyDataService {
    id = 'model-property-data-service';
    label = 'Model property data service';
    currentUri: string;

    @inject(ModelService) protected modelService: ModelService;

    canHandleSelection(selection: GlspSelection | undefined): number {
        return isGlspSelection(selection) ? 1 : 0;
    }

    async providePropertyData(selection: GlspSelection | undefined): Promise<DiagramNodeEntity | undefined> {
        if (selection && isGlspSelection(selection) && selection.sourceUri && selection.selectedElementsIDs.length !== 0) {
            const entity: DiagramNodeEntity | undefined = await this.modelService.requestDiagramNodeEntityModel(
                selection.sourceUri,
                selection.selectedElementsIDs[0]
            );

            if (entity) {
                if (this.currentUri !== entity.uri) {
                    await this.modelService.close(this.currentUri);
                    this.currentUri = entity.uri;
                    await this.modelService.open(this.currentUri);
                }

                return Promise.resolve(entity);
            } else {
                Promise.reject();
            }
        } else {
            return Promise.reject();
        }
    }
}
