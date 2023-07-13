/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelRoot } from '@crossbreeze/protocol';
import { CommandService, Emitter, Event } from '@theia/core';
import { LabelProvider, NavigatableWidget, NavigatableWidgetOptions, ReactWidget, SaveOptions, Saveable } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FormEditorService } from '../common/form-client-protocol';
import { FormEditorClientImpl } from './form-client';

import { App } from './react-components/App';
import '../../style/form-view.css';

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
    @inject(FormEditorService) private readonly formEditorService: FormEditorService;
    @inject(CommandService) protected commandService: CommandService;
    @inject(FormEditorClientImpl) protected formClient: FormEditorClientImpl;

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
            await this.formEditorService.open(uri);
            const model = await this.formEditorService.request(uri);
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

        await this.formEditorService.save(this.getResourceUri().toString(), this.model);
    }

    protected async updateModel(model: CrossModelRoot): Promise<void> {
        // If we were the ones that send the save request, we do not want to update the model again
        if (this.saveUpdate) {
            this.saveUpdate = false;
            return;
        }

        this.model = model;
        await this.formEditorService.update(this.getResourceUri().toString(), this.model!);
    }

    override close(): void {
        this.formEditorService.close(this.getResourceUri().toString());
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
