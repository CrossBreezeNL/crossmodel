/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { UpdateClientOperation } from '@crossbreeze/protocol';
import { Command, OperationHandler } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { CrossModelState } from '../model/cross-model-state';
import { CrossModelCommand } from './cross-model-command';

@injectable()
export class CrossModelUpdateClientOperationHandler extends OperationHandler {
    override operationType = UpdateClientOperation.KIND;

    @inject(CrossModelState) protected state: CrossModelState;

    createCommand(_operation: UpdateClientOperation): Command {
        return new CrossModelCommand(this.state, () => {
            /* do nothing, just trigger update*/
        });
    }
}
