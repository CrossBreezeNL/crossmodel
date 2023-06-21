/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ReactWidget } from '@theia/core/lib/browser';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';
import { PropertyViewContentWidget } from '@theia/property-view/lib/browser/property-view-content-widget';
import { DefaultPropertyViewWidgetProvider } from '@theia/property-view/lib/browser/property-view-widget-provider';
import * as React from '@theia/core/shared/react';
import { injectable } from '@theia/core/shared/inversify';
import { isSprottySelection } from '@eclipse-glsp/theia-integration';

export class AttributeWidget extends ReactWidget implements PropertyViewContentWidget {
    static readonly ID = 'attribute-property-view';
    static readonly LABEL = 'Attribute Information';

    protected currentNode: Object | undefined;

    constructor() {
        super();
        this.id = AttributeWidget.ID;
        this.title.label = AttributeWidget.LABEL;
        this.title.caption = AttributeWidget.LABEL;
        this.title.closable = false;
        this.node.tabIndex = 0;
    }

    updatePropertyViewContent(propertyDataService?: PropertyDataService, selection?: Object | undefined): void {
        if (propertyDataService) {
            propertyDataService.providePropertyData(selection).then(nodeInfo => (this.currentNode = nodeInfo));
        }

        this.update();
    }

    protected render(): React.ReactNode {
        return <div>{JSON.stringify(this.currentNode)}</div>;
    }
}

@injectable()
export class AttributePropertyWidgetProvider extends DefaultPropertyViewWidgetProvider {
    override readonly id = 'attributes-info';
    override readonly label = 'AttributePropertyWidgetProvider';

    private attributeWidget: AttributeWidget;

    constructor() {
        super();
        this.attributeWidget = new AttributeWidget();
    }

    override canHandle(selection: Object | undefined): number {
        if (selection && (selection as any).hasOwnProperty('additionalSelectionData')) {
            delete (selection as any).additionalSelectionData;
        }

        return isSprottySelection(selection) ? 1 : 0;
    }

    override provideWidget(selection: Object | undefined): Promise<AttributeWidget> {
        return Promise.resolve(this.attributeWidget);
    }

    override updateContentWidget(selection: Object | undefined): void {
        this.getPropertyDataService(selection).then(service => this.attributeWidget.updatePropertyViewContent(service, selection));
    }
}
