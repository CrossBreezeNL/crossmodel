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

    private attributeWidget: ModelPropertyWidget;

    constructor() {
        super();
        this.attributeWidget = new ModelPropertyWidget();
    }

    override canHandle(selection: GlspSelection | undefined): number {
        return isGlspSelection(selection) ? 1 : 0;
    }

    override provideWidget(selection: GlspSelection | undefined): Promise<ModelPropertyWidget> {
        return Promise.resolve(this.attributeWidget);
    }

    override updateContentWidget(selection: GlspSelection | undefined): void {
        this.getPropertyDataService(selection).then(service => this.attributeWidget.updatePropertyViewContent(service, selection));
    }
}
