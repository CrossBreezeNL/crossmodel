/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { Emitter } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { CrossModelRoot, FormEditorClient } from '../common/form-client-protocol';

export interface ModelDocument {
    uri: string;
    model: CrossModelRoot;
}

@injectable()
export class FormEditorClientImpl implements FormEditorClient {
    protected onUpdateEmitter = new Emitter<ModelDocument>();
    onUpdate = this.onUpdateEmitter.event;

    async getName(): Promise<string> {
        return 'Client';
    }

    async updateModel(uri: string, model: CrossModelRoot): Promise<void> {
        this.onUpdateEmitter.fire({ uri, model });
    }
}
