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

/**
 * A custom recording command that tracks updates during exection through a textual semantic state.
 * Tracking updates ensures that we have proper undo/redo support
 */
export class CrossModelCommand extends AbstractRecordingCommand<AnyObject> {
   constructor(protected state: CrossModelState, protected runnable: () => MaybePromise<void>) {
      super();
   }

   protected getJsonObject(): SemanticState {
      // we always use the whole serialized state of an object, basically replacing the complete root model
      return { text: this.state.semanticText() };
   }

   protected override async applyPatch(state: SemanticState, patch: Operation[]): Promise<void> {
      super.applyPatch(state, patch);
      // the undo/redo probably made some changes to the semantic model so we restore the stored state and re-index before the next command
      return this.state.updateSemanticRoot(state.text);
   }

   protected async doExecute(): Promise<void> {
      await this.runnable();
      // the command probably made some changes to the semantic model so we re-index before the next command
      return this.state.updateSemanticRoot();
   }
}
