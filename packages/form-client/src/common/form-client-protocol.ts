/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelRoot } from '@crossbreeze/protocol';
import { JsonRpcServer } from '@theia/core';

/** Path used to communicate between the Theia frontend and backend */
export const FORM_EDITOR_SERVICE_PATH = '/services/withClient';

/**
 * Protocol used by the Theia frontend-backend communication
 */
export const FormEditorService = Symbol('FormEditorService');
export interface FormEditorService extends JsonRpcServer<FormEditorClient> {
    open(uri: string): Promise<void>;
    close(uri: string): Promise<void>;
    request(uri: string): Promise<CrossModelRoot | undefined>;
    update(uri: string, model: CrossModelRoot): Promise<void>;
    save(uri: string, model: CrossModelRoot): Promise<void>;
}

export const FormEditorClient = Symbol('FormEditorClient');
export interface FormEditorClient {
    getName(): Promise<string>;
    updateModel(uri: string, model: CrossModelRoot): Promise<void>;
}
