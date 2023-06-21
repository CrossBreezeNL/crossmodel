/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { Emitter } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';

export interface NobeUpdate {
    uri: string;
    nobe: Nobe;
}

export const AttributeFrontEndClient = Symbol('AttributeFrontEndClient');
export interface AttributeFrontEndClient {
    getName(): Promise<string>;
    updateSelectedNobe(uri: string, nobe: Nobe): Promise<void>;
}

@injectable()
export class AttributeFrontEndClientImpl implements AttributeFrontEndClient {
    protected onUpdateEmitter = new Emitter<NobeUpdate>();
    onUpdate = this.onUpdateEmitter.event;

    async getName(): Promise<string> {
        return 'Client';
    }

    async updateSelectedNobe(uri: string, nobe: Nobe): Promise<void> {
        this.onUpdateEmitter.fire({ uri, nobe });
    }
}
