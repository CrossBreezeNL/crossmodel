/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { Message, ReactWidget, SaveOptions, Saveable } from '@theia/core/lib/browser';
import { PropertyDataService } from '@theia/property-view/lib/browser/property-data-service';
import { PropertyViewContentWidget } from '@theia/property-view/lib/browser/property-view-content-widget';
import * as React from '@theia/core/shared/react';

import { GlspSelection } from '@eclipse-glsp/theia-integration';
import { App } from './react-components/App';
import { CrossModelRoot, isDiagramNodeEntity } from '@crossbreeze/model-service';
import { Emitter, Event } from '@theia/core';

export class ModelPropertyWidget extends ReactWidget implements PropertyViewContentWidget, Saveable {
    dirty = true;
    autoSave: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange';
    public readonly onDirtyChangedEmitter = new Emitter<void>();
    onDirtyChanged: Event<void> = this.onDirtyChangedEmitter.event;
    saveUpdate = false;

    static readonly ID = 'attribute-property-view';
    static readonly LABEL = 'Model property widget';

    protected model: CrossModelRoot | undefined;
    protected uri: string;

    constructor() {
        super();
        this.id = ModelPropertyWidget.ID;
        this.title.label = ModelPropertyWidget.LABEL;
        this.title.caption = ModelPropertyWidget.LABEL;
        this.title.closable = false;
        this.node.tabIndex = 0;
    }

    async save(options?: SaveOptions | undefined): Promise<void> {
        console.log('test1234');
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

    protected render(): React.ReactNode {
        console.log(this.isVisible);

        return <App model={this.model} />;
    }

    protected override onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.focus();
    }
}
