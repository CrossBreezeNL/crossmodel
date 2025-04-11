/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/

import { TheiaDialog } from '@theia/playwright';

export class TheiaMinimalDialog extends TheiaDialog {
   async confirm(): Promise<void> {
      // do not expect a visible button, just hit 'Enter' in the input field
      const inputField = this.page.locator(`${this.blockSelector} .theia-input`);
      await inputField.focus();
      await inputField.press('Enter');
   }
}
