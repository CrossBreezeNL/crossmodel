/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
   Action,
   DirtyStateChangeReason,
   MarkersReason,
   ModelSubmissionHandler,
   ServerLayoutKind,
   SetDirtyStateAction,
   SetMarkersAction,
   UpdateModelAction
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';

/**
 * Custom implementation until we upgrade to a version where https://github.com/eclipse-glsp/glsp/issues/1227 is resolved.
 */
@injectable()
export class CrossModelSubmitHandler extends ModelSubmissionHandler {
   override async submitModelDirectly(reason?: DirtyStateChangeReason): Promise<Action[]> {
      if (this.diagramConfiguration.layoutKind === ServerLayoutKind.AUTOMATIC && this.layoutEngine) {
         await this.layoutEngine.layout();
      }

      const root = this.serializeGModel();

      const result: Action[] = [];
      result.push(
         this.requestModelAction
            ? this.createSetModeAction(root)
            : UpdateModelAction.create(root, { animate: this.diagramConfiguration.animatedUpdate })
      );
      if (!this.diagramConfiguration.needsClientLayout) {
         result.push(SetDirtyStateAction.create(this.commandStack.isDirty, { reason }));
      }
      if (this.validator) {
         const markers = await this.validator.validate([this.modelState.root], MarkersReason.LIVE);
         result.push(SetMarkersAction.create(markers, { reason: MarkersReason.LIVE }));
      }
      return result;
   }
}
