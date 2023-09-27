/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ModelService, ModelServiceClient } from '@crossbreeze/model-service/lib/common';
import { CrossModelRoot } from '@crossbreeze/protocol';
import { CommandService, Emitter, Event } from '@theia/core';
import { LabelProvider, NavigatableWidget, NavigatableWidgetOptions, ReactWidget, SaveOptions, Saveable } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import '../../style/form-view.css';
import { App } from './react-components/App';
import debounce = require('p-debounce');
import deepEqual = require('fast-deep-equal');

export const FormEditorWidgetOptions = Symbol('FormEditorWidgetOptions');
export interface FormEditorWidgetOptions extends NavigatableWidgetOptions {
    id: string;
}

@injectable()
export class FormEditorWidget extends ReactWidget implements NavigatableWidget, Saveable {
    dirty = false;
    autoSave: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange';
    public readonly onDirtyChangedEmitter = new Emitter<void>();
    onDirtyChanged: Event<void> = this.onDirtyChangedEmitter.event;

    @inject(FormEditorWidgetOptions) protected options: FormEditorWidgetOptions;
    @inject(LabelProvider) protected labelProvider: LabelProvider;
    @inject(ModelService) private readonly modelService: ModelService;
    @inject(CommandService) protected commandService: CommandService;
    @inject(ModelServiceClient) protected formClient: ModelServiceClient;

    protected syncedModel: CrossModelRoot | undefined = undefined;
    protected error: string | undefined = undefined;

    @postConstruct()
    init(): void {
        // Widget options
        this.id = this.options.id;
        this.title.label = this.labelProvider.getName(this.getResourceUri());
        this.title.iconClass = this.labelProvider.getIcon(this.getResourceUri());
        this.title.closable = true;

        this.updateModel = this.updateModel.bind(this);
        this.getResourceUri = this.getResourceUri.bind(this);
        this.loadModel();

        this.formClient.onUpdate(document => {
            if (document.uri === this.getResourceUri().toString()) {
                this.modelUpdated(document.model);
            }
        });
    }

    protected async loadModel(): Promise<void> {
        try {
            const uri = this.getResourceUri().toString();
            await this.modelService.open(uri);
            const model = await this.modelService.request(uri);
            if (model) {
                this.syncedModel = model;
            }
        } catch (error: any) {
            this.error = error;
        } finally {
            this.update();
        }
    }

    async save(options?: SaveOptions | undefined): Promise<void> {
        if (this.syncedModel === undefined) {
            throw new Error('Cannot save undefined model');
        }

        this.setDirty(false);
        await this.modelService.save(this.getResourceUri().toString(), this.syncedModel);
    }

    protected updateModel = debounce((model: CrossModelRoot) => {
        if (!deepEqual(this.syncedModel, model)) {
            this.syncedModel = model;
            this.modelService.update(this.getResourceUri().toString(), model);
        }
    }, 200);

    protected modelUpdated(model: CrossModelRoot): void {
        if (!deepEqual(this.syncedModel, model)) {
            this.syncedModel = model;
            this.update();
        }
    }

    override close(): void {
        this.modelService.close(this.getResourceUri().toString());
        super.close();
    }

    setDirty(dirty: boolean): void {
        if (dirty === this.dirty) {
            return;
        }

        this.dirty = dirty;
        this.onDirtyChangedEmitter.fire();
    }

    render(): React.ReactNode {
        const props = {
            model: this.syncedModel,
            updateModel: this.updateModel,
            getResourceUri: this.getResourceUri,
            formClient: this.formClient
        };

        return <App {...props} />;
    }

    getResourceUri(): URI {
        return new URI(this.options.uri);
    }

    createMoveToUri(resourceUri: URI): URI | undefined {
        return undefined;
    }
}
