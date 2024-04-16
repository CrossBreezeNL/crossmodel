/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelWidget, CrossModelWidgetOptions } from '@crossbreeze/core/lib/browser';
import { NavigatableWidget, NavigatableWidgetOptions } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';

export interface FormEditorWidgetOptions extends CrossModelWidgetOptions, NavigatableWidgetOptions {
   uri: string;
}

@injectable()
export class FormEditorWidget extends CrossModelWidget implements NavigatableWidget {
   @inject(CrossModelWidgetOptions) protected override options: FormEditorWidgetOptions;

   protected override handleOpenRequest = undefined; // we do not need to support opening in editor, we are the editor
   protected override handleSaveRequest = undefined; // we do not need to support saving through the widget itself, we are a Theia editor

   getResourceUri(): URI {
      return new URI(this.options.uri);
   }

   createMoveToUri(resourceUri: URI): URI | undefined {
      return resourceUri;
   }
}
