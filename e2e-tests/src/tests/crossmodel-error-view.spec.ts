/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { expect } from '@playwright/test';
import test, { app } from '../fixtures/crossmodel-fixture';
import { CrossModelCompositeEditor } from '../page-objects/crossmodel-composite-editor';

test.describe('CrossModel Error Views', () => {
   test('Form Editor should show error if model code is broken', async () => {
      const editor = await app.openEditor('example-entity.entity.cm', CrossModelCompositeEditor);
      expect(editor).toBeDefined();

      const codeEditor = await editor.switchToCodeEditor();
      expect(codeEditor).toBeDefined();
      await codeEditor.addTextToNewLineAfterLineByLineNumber(2, 'break-model');

      const formEditor = await editor.switchToFormEditor();
      expect(
         await formEditor.hasError(
            // eslint-disable-next-line max-len
            "The file contains one or more errors. Please fix the error(s) using the 'Code Editor'. This perspective will be read-only until the errors are resolved."
         )
      ).toBeTruthy();
   });

   test('System Diagram Editor should show error if model code is broken', async () => {
      const editor = await app.openEditor('example-diagram.diagram.cm', CrossModelCompositeEditor);
      expect(editor).toBeDefined();

      const codeEditor = await editor.switchToCodeEditor();
      expect(codeEditor).toBeDefined();
      await codeEditor.addTextToNewLineAfterLineByLineNumber(2, 'break-model');

      const diagramEditor = await editor.switchToSystemDiagram();
      expect(
         await diagramEditor.hasError(
            // eslint-disable-next-line max-len
            "The file contains one or more errors. Please fix the error(s) using the 'Code Editor'. This perspective will be read-only until the errors are resolved."
         )
      ).toBeTruthy();
   });
});
