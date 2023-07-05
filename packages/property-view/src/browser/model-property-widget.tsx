/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { Message, ReactWidget } from '@theia/core/lib/browser';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';
import { PropertyViewContentWidget } from '@theia/property-view/lib/browser/property-view-content-widget';
import * as React from '@theia/core/shared/react';

import { GlspSelection } from '@eclipse-glsp/theia-integration';
import { ModelService } from '@crossbreeze/model-service';
import { CrossModelRoot, isDiagramNodeEntity } from '@crossbreeze/protocol';
import { inject, injectable } from '@theia/core/shared/inversify';
import { App } from './react-components/App';

@injectable()
export class ModelPropertyWidget extends ReactWidget implements PropertyViewContentWidget {
    static readonly ID = 'attribute-property-view';
    static readonly LABEL = 'Model property widget';

    @inject(ModelService) protected modelService: ModelService;

    protected model: CrossModelRoot | undefined;
    protected uri: string;

    constructor() {
        super();
        this.id = ModelPropertyWidget.ID;
        this.title.label = ModelPropertyWidget.LABEL;
        this.title.caption = ModelPropertyWidget.LABEL;
        this.title.closable = false;
        this.node.tabIndex = 0;

        this.saveModel = this.saveModel.bind(this);
        this.updateModel = this.updateModel.bind(this);
    }

    updatePropertyViewContent(propertyDataService?: PropertyDataService, selection?: GlspSelection | undefined): void {
        if (propertyDataService) {
            propertyDataService.providePropertyData(selection).then(
                selectionData => {
                    if (isDiagramNodeEntity(selectionData)) {
                        this.model = selectionData.model;
                        this.uri = selectionData.uri;

                        this.update();
                    }
                },
                error => {
                    this.model = undefined;
                }
            );
        }
    }

    async saveModel(): Promise<void> {
        if (this.model === undefined || this.uri === undefined) {
            throw new Error('Cannot save undefined model');
        }

        await this.modelService.save(this.uri, this.model);
    }

    protected async updateModel(model: CrossModelRoot): Promise<void> {
        this.model = model;
    }

    protected render(): React.ReactNode {
        const props = {
            model: this.model,
            saveModel: this.saveModel,
            updateModel: this.updateModel
        };

        return <App {...props} />;
    }

    protected override onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.focus();
    }
}
