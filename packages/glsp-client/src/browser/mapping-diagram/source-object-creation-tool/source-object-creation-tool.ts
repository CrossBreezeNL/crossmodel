/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
   Action,
   BaseEditTool,
   CursorCSS,
   cursorFeedbackAction,
   Disposable,
   FeedbackEmitter,
   GModelElement,
   MouseListener,
   SetUIExtensionVisibilityAction
} from '@eclipse-glsp/client';
import { injectable } from '@theia/core/shared/inversify';
import { CrossModelCommandPalette } from '../../cross-model-command-palette';

@injectable()
export class SourceObjectCreationTool extends BaseEditTool {
   static readonly ID = 'source-object-creation-tool';

   get id(): string {
      return SourceObjectCreationTool.ID;
   }
   override enable(): void {
      const mouseFeedback = new SourceObjectCreationMouseListener(this);
      this.toDisposeOnDisable.push(mouseFeedback, this.mouseTool.registerListener(mouseFeedback));
   }
}

@injectable()
export class SourceObjectCreationMouseListener extends MouseListener implements Disposable {
   cursorFeedback: FeedbackEmitter;
   constructor(protected tool: SourceObjectCreationTool) {
      super();
      this.cursorFeedback = tool.createFeedbackEmitter();
      this.cursorFeedback.add(cursorFeedbackAction(CursorCSS.NODE_CREATION), cursorFeedbackAction()).submit();
   }

   override mouseUp(_target: GModelElement, _event: MouseEvent): (Action | Promise<Action>)[] {
      return [
         SetUIExtensionVisibilityAction.create({
            extensionId: CrossModelCommandPalette.ID,
            visible: true
         })
      ];
   }

   dispose(): void {
      this.cursorFeedback.dispose();
   }
}
