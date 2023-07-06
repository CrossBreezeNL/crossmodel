/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { DefaultPropertyViewWidgetProvider } from '@theia/property-view/lib/browser/property-view-widget-provider';
import { inject, injectable } from '@theia/core/shared/inversify';
import { GlspSelection, isGlspSelection } from '@eclipse-glsp/theia-integration';
import { ModelPropertyWidget } from './model-property-widget';
import { ModelService } from '@crossbreeze/model-service';

@injectable()
export class ModelPropertyWidgetProvider extends DefaultPropertyViewWidgetProvider {
    override readonly id = 'model-property-widget-provider';
    override readonly label = 'Model Property Widget Provider';
    currentUri = '';
    currentNode = '';

    @inject(ModelPropertyWidget) protected modelPropertyWidget: ModelPropertyWidget;
    @inject(ModelService) protected modelService: ModelService;

    constructor() {
        super();
    }

    override canHandle(selection: GlspSelection | undefined): number {
        return isGlspSelection(selection) ? 100 : 0;
    }

    override provideWidget(selection: GlspSelection | undefined): Promise<ModelPropertyWidget> {
        return Promise.resolve(this.modelPropertyWidget);
    }

    override updateContentWidget(selection: GlspSelection | undefined): void {
        if (selection?.sourceUri && (selection?.sourceUri !== this.currentUri || selection.selectedElementsIDs[0] !== this.currentNode)) {
            this.currentUri = selection?.sourceUri;
            this.currentNode = selection.selectedElementsIDs[0];

            this.getPropertyDataService(selection).then(service => this.modelPropertyWidget.updatePropertyViewContent(service, selection));
        }
    }
}
