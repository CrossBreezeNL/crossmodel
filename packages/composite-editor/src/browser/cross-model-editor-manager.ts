/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { URI } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { EditorPreviewManager } from '@theia/editor-preview/lib/browser/editor-preview-manager';
import { EditorOpenerOptions, EditorWidget } from '@theia/editor/lib/browser';

/**
 * Customization of the editor preview manager that changes the visibility of the `revealSelection` method.
 * This ensures tha the `CompositeEditor` can also use this method
 */
@injectable()
export class CrossModelEditorManager extends EditorPreviewManager {
   public override revealSelection(widget: EditorWidget, input?: EditorOpenerOptions, uri?: URI): void {
      super.revealSelection(widget, input, uri);
   }
}
