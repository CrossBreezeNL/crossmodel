/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { DefaultPropertyViewWidgetProvider } from '@theia/property-view/lib/browser/property-view-widget-provider';
import { injectable } from '@theia/core/shared/inversify';
import { GlspSelection, isGlspSelection } from '@eclipse-glsp/theia-integration';
import { ModelPropertyWidget } from './model-property-widget';

@injectable()
export class ModelPropertyWidgetProvider extends DefaultPropertyViewWidgetProvider {
    override readonly id = 'model-property-widget-provider';
    override readonly label = 'Model Property Widget Provider';
    currentUri = '';
    currentNode = '';

    private attributeWidget: ModelPropertyWidget;

    constructor() {
        super();
        this.attributeWidget = new ModelPropertyWidget();
    }

    override canHandle(selection: GlspSelection | undefined): number {
        return isGlspSelection(selection) ? 100 : 0;
    }

    override provideWidget(selection: GlspSelection | undefined): Promise<ModelPropertyWidget> {
        return Promise.resolve(this.attributeWidget);
    }

    override updateContentWidget(selection: GlspSelection | undefined): void {
        if (selection?.sourceUri && (selection?.sourceUri !== this.currentUri || selection.selectedElementsIDs[0] !== this.currentNode)) {
            this.currentUri = selection?.sourceUri;
            this.currentNode = selection.selectedElementsIDs[0];

            this.getPropertyDataService(selection).then(service => this.attributeWidget.updatePropertyViewContent(service, selection));
        }
    }
}
