/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { inject, injectable } from '@theia/core/shared/inversify';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';
import { isSprottySelection } from '@eclipse-glsp/theia-integration';
import { ModelService } from '@crossbreeze/model-service';

export interface TheiaGLSPSelection {
    selectedElementsIDs: Array<string>;
    widgetId: string;
    sourceUri: string;
    additionalSelectionData?: string;
}

@injectable()
export class AttributeDataService implements PropertyDataService {
    id = 'property-view-data-service';
    label = 'Property view data service';

    @inject(ModelService) protected modelService: ModelService;

    canHandleSelection(selection: TheiaGLSPSelection | undefined): number {
        if (selection) {
            delete selection.additionalSelectionData;
        }

        return isSprottySelection(selection) ? 1 : 0;
    }

    async providePropertyData(selection: TheiaGLSPSelection | undefined): Promise<Object | undefined> {
        if (selection) {
            delete selection.additionalSelectionData;
        } else {
            return Promise.reject();
        }

        if (isSprottySelection(selection)) {
            const result = this.attributeServer.getNobe(selection.selectedElementsIDs[0]);

            return Promise.resolve(result);
        } else {
            return Promise.reject();
        }
    }
}
