/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { MaybePromise, nls } from '@theia/core';
import { NavigatableWidgetOpenHandler, WidgetOpenerOptions } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { injectable } from '@theia/core/shared/inversify';
import { FormEditorWidget } from './form-editor-widget';

@injectable()
export class FormEditorOpenHandler extends NavigatableWidgetOpenHandler<FormEditorWidget> {
   static ID = 'form-editor-opener';

   readonly id = FormEditorOpenHandler.ID;
   readonly label = nls.localize('form-client/form-editor', 'Form Editor');

   canHandle(uri: URI, options?: WidgetOpenerOptions): MaybePromise<number> {
      return uri.path.ext === '.cm' ? 1 : -1;
   }
}

export function createFormEditorId(uri: URI, counter?: number): string {
   return FormEditorOpenHandler.ID + `:${uri.toString()}` + (counter !== undefined ? `:${counter}` : '');
}
