/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { EnvVariablesServerImpl } from '@theia/core/lib/node/env-variables';
import { FileUri } from '@theia/core/lib/node/file-uri';
import { injectable } from 'inversify';
import { homedir } from 'os';
import * as path from 'path';

@injectable()
export class CMEnvVariableServer extends EnvVariablesServerImpl {
    protected readonly _configDirUri: string = FileUri.create(path.join(homedir(), '.crossmodel')).toString(true);

    override async getConfigDirUri(): Promise<string> {
        return this._configDirUri;
    }
}
