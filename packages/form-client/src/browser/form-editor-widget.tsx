/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ModelServiceClientImpl } from '@crossbreeze/model-service/lib/browser';
import { CrossModelRoot } from '@crossbreeze/protocol';
import { CommandService, Emitter, Event } from '@theia/core';
import { LabelProvider, NavigatableWidget, NavigatableWidgetOptions, ReactWidget, SaveOptions, Saveable } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';

import { ModelService } from '@crossbreeze/model-service/lib/common';
import '../../style/form-view.css';
import { App } from './react-components/App';

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
    saveUpdate = false;

    @inject(FormEditorWidgetOptions) protected options: FormEditorWidgetOptions;
    @inject(LabelProvider) protected labelProvider: LabelProvider;
    @inject(ModelService) private readonly modelService: ModelService;
    @inject(CommandService) protected commandService: CommandService;
    @inject(ModelServiceClientImpl) protected formClient: ModelServiceClientImpl;

    protected model: CrossModelRoot | undefined = undefined;
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
    }

    protected async loadModel(): Promise<void> {
        try {
            const uri = this.getResourceUri().toString();
            await this.modelService.open(uri);
            const model = await this.modelService.request(uri);
            if (model) {
                this.model = model;
            }
        } catch (error: any) {
            this.error = error;
        } finally {
            this.update();
        }
    }

    async save(options?: SaveOptions | undefined): Promise<void> {
        if (this.model === undefined) {
            throw new Error('Cannot save undefined model');
        }

        this.setDirty(false);
        // When the model on the model-server is updated we will get a notification that the model has been saved.
        // This variable lets us know that we were the ones that saved the model
        this.saveUpdate = true;

        await this.modelService.save(this.getResourceUri().toString(), this.model);
    }

    protected async updateModel(model: CrossModelRoot): Promise<void> {
        // If we were the ones that send the save request, we do not want to update the model again
        if (this.saveUpdate) {
            this.saveUpdate = false;
            return;
        }

        this.model = model;
        await this.modelService.update(this.getResourceUri().toString(), this.model!);
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
            model: this.model,
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
