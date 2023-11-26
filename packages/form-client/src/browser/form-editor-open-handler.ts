/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { MaybePromise, nls } from '@theia/core';
import { NavigatableWidgetOpenHandler } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { injectable } from '@theia/core/shared/inversify';
import { FormEditorWidget } from './form-editor-widget';

@injectable()
export class FormEditorOpenHandler extends NavigatableWidgetOpenHandler<FormEditorWidget> {
   static ID = 'form-editor-opener';

   readonly id = FormEditorOpenHandler.ID; // must match the id of the widget factory
   readonly label = nls.localize('form-client/form-editor', 'Form Editor');

   canHandle(uri: URI): MaybePromise<number> {
      return uri.path.ext === '.cm' ? 1 : -1;
   }
}

export function createFormEditorId(uri: URI, counter?: number): string {
   // ensure we create a unique ID
   return FormEditorOpenHandler.ID + `:${uri.toString()}` + (counter !== undefined ? `:${counter}` : '');
}
