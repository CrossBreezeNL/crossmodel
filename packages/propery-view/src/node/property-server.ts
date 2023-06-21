/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { JsonRpcServer } from '@theia/core';

import { injectable } from '@theia/core/shared/inversify';
import { AttributeFrontEndClient } from '../common/pv-frontend-client';

export const AttributePropertyServer = Symbol('AttributePropertyServer');

export interface AttributePropertyServer extends JsonRpcServer<AttributeFrontEndClient> {
    getNobe(uri: string): Promise<Nobe>;
}

@injectable()
export class AttributePropertyServerImp implements AttributePropertyServer {
    protected client: AttributeFrontEndClient;

    async getNobe(uri: string): Promise<Nobe> {
        return {
            id: uri,
            name: 'Test123124412',
            position: { x: 123, y: 123 },
            size: { height: 123, width: 123 }
        };
    }

    dispose(): void {
        throw new Error('Method not implemented.');
    }

    setClient(client: AttributeFrontEndClient): void {
        this.client = client;
    }

    getClient?(): AttributeFrontEndClient | undefined {
        return this.client;
    }
}
