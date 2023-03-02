/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { JsonRpcServer } from '@theia/core';

export const FormEditorService = Symbol('FormEditorService');
export const FORM_EDITOR_SERVICE_PATH = '/services/withClient';

export interface CrossModelRoot {
   readonly $type: 'CrossModelRoot';
   entity?: Entity;
   relationship?: Relationship;
}

export interface Relationship {
   readonly $type: 'Relationship';
   name: string;
   properties: Array<Property>;
   source: string;
   target: string;
   type: '1:1' | '1:n' | 'n:1' | 'n:m';
}

export interface Property {
   readonly $type: 'Property';
   key: string;
   value: number | string;
}

export interface Entity {
   readonly $type: 'Entity';
   name: string;
   description: string;
   attributes: Array<Attribute>;
}

export interface Attribute {
   readonly $type: 'Attribute';
   name: string;
   value: number | string;
}

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
}
