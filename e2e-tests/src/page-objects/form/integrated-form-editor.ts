/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { OSUtil, normalizeId, urlEncodePath } from '@theia/playwright';
import { join } from 'path';
import { CMCompositeEditor, hasViewError } from '../cm-composite-editor';
import { IntegratedEditor } from '../cm-integrated-editor';
import { CMForm } from './cm-form';
import { LogicalEntityForm } from './entity-form';
import { RelationshipForm } from './relationship-form';
export class IntegratedFormEditor extends IntegratedEditor {
   constructor(filePath: string, parent: CMCompositeEditor, tabSelector: string) {
      super(
         {
            tabSelector,
            viewSelector: normalizeId(
               `#form-editor-opener:${parent.scheme === 'file' ? 'file://' : `${parent.scheme}:`}${urlEncodePath(
                  join(parent.app.workspace.escapedPath, OSUtil.fileSeparator, filePath)
               )}`
            )
         },
         parent
      );
   }

   async hasError(errorMessage: string): Promise<boolean> {
      return hasViewError(this.page, this.viewSelector, errorMessage);
   }

   async formFor(logicalEntity: 'entity'): Promise<LogicalEntityForm>;
   async formFor(relationship: 'relationship'): Promise<RelationshipForm>;
   async formFor(string: 'entity' | 'relationship'): Promise<CMForm> {
      if (string === 'entity') {
         const form = new LogicalEntityForm(this, '');
         await form.waitForVisible();
         return form;
      } else {
         const form = new RelationshipForm(this, '');
         await form.waitForVisible();
         return form;
      }
   }
}
