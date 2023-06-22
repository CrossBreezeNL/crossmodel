/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { inject, injectable } from '@theia/core/shared/inversify';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';
import { GlspSelection, isGlspSelection } from '@eclipse-glsp/theia-integration';
import { CrossModelRoot, ModelService } from '@crossbreeze/model-service';

@injectable()
export class ModelDataService implements PropertyDataService {
    id = 'model-property-data-service';
    label = 'Model property data service';

    @inject(ModelService) protected modelService: ModelService;

    canHandleSelection(selection: GlspSelection | undefined): number {
        return isGlspSelection(selection) ? 1 : 0;
    }

    async providePropertyData(selection: GlspSelection | undefined): Promise<CrossModelRoot | undefined> {
        if (isGlspSelection(selection)) {
            return Promise.resolve({
                $type: 'CrossModelRoot',
                entity: {
                    $type: 'Entity',
                    name: 'Order',
                    description: 'Orders geplaatst door de klant',
                    attributes: [
                        {
                            $type: 'Attribute',
                            name: 'werk',
                            value: 'Float'
                        },
                        {
                            $type: 'Attribute',
                            name: 'test49999912somsdit',
                            value: 'Char'
                        },
                        {
                            $type: 'Attribute',
                            name: 'wat111234',
                            value: 'Varchar'
                        },
                        {
                            $type: 'Attribute',
                            name: 'hall1123',
                            value: 'Integer'
                        },
                        {
                            $type: 'Attribute',
                            name: 'ditwerktdusnietaltijd',
                            value: 'test1234'
                        }
                    ]
                }
            });
        } else {
            return Promise.reject();
        }
    }
}
