/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { inject, injectable } from 'inversify';
import { Action, ActionHandler, GModelFactory, GModelSerializer, MaybePromise, ModelSubmissionHandler } from '@eclipse-glsp/server';
import { UpdateClientAction } from '@crossbreeze/protocol';
import { CrossModelState } from '../model/cross-model-state';

@injectable()
export class CrossModelUpdateClientActionHandler implements ActionHandler {
    actionKinds = [UpdateClientAction.KIND];

    @inject(CrossModelState) protected state: CrossModelState;
    @inject(GModelSerializer) serializer: GModelSerializer;
    @inject(GModelFactory) gmodelFactory: GModelFactory;
    @inject(ModelSubmissionHandler) protected submissionHandler: ModelSubmissionHandler;

    execute(action: UpdateClientAction): MaybePromise<Action[]> {
        const result = this.submissionHandler.submitModel();
        return result;
    }
}
