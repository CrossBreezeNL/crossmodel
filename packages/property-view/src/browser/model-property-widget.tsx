/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ReactWidget } from '@theia/core/lib/browser';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';
import { PropertyViewContentWidget } from '@theia/property-view/lib/browser/property-view-content-widget';
import * as React from '@theia/core/shared/react';

import { GlspSelection } from '@eclipse-glsp/theia-integration';
import { App } from './react-components/App';
import { CrossModelRoot, isCrossModelRoot } from '@crossbreeze/model-service';

export class ModelPropertyWidget extends ReactWidget implements PropertyViewContentWidget {
    static readonly ID = 'attribute-property-view';
    static readonly LABEL = 'Model property widget';

    protected model: CrossModelRoot | undefined;

    constructor() {
        super();
        this.id = ModelPropertyWidget.ID;
        this.title.label = ModelPropertyWidget.LABEL;
        this.title.caption = ModelPropertyWidget.LABEL;
        this.title.closable = false;
        this.node.tabIndex = 0;
    }

    updatePropertyViewContent(propertyDataService?: PropertyDataService, selection?: GlspSelection | undefined): void {
        if (propertyDataService) {
            propertyDataService.providePropertyData(selection).then(selectionData => {
                if (isCrossModelRoot(selectionData)) {
                    this.model = selectionData;
                }
            });
        }

        this.update();
    }

    protected render(): React.ReactNode {
        return <App model={this.model} />;
    }
}
