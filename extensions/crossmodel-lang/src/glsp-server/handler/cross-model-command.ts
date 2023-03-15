/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AnyObject, MaybePromise } from '@eclipse-glsp/server';
import { AbstractRecordingCommand } from '@eclipse-glsp/server/lib/common/command/recording-command';
import { Operation } from 'fast-json-patch';
import { CrossModelState } from '../model/cross-model-state';

// needs to be serializable so we use the text for now as the AST nodes have circular dependencies
interface SemanticState {
   text: string;
}

export class CrossModelCommand extends AbstractRecordingCommand<AnyObject> {
   constructor(protected state: CrossModelState, protected runnable: () => MaybePromise<void>) {
      super();
   }

   protected getJsonObject(): SemanticState {
      return { text: this.state.semanticText() };
   }

   protected override async applyPatch(state: SemanticState, patch: Operation[]): Promise<void> {
      super.applyPatch(state, patch);
      return this.state.updateSemanticRoot(state.text);
   }

   protected async doExecute(): Promise<void> {
      await this.runnable();
      return this.state.updateSemanticRoot();
   }
}
