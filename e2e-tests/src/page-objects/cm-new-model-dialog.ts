/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { TheiaDialog, USER_KEY_TYPING_DELAY } from '@theia/playwright';

export class CMNewModelInputDialog extends TheiaDialog {
   protected gridSelector = '.new-model-input-grid';

   async enterName(inputValue: string): Promise<void> {
      return this.enterByLabel('Model Name', inputValue);
   }

   async enterVersion(inputValue: string): Promise<void> {
      return this.enterByLabel('Version', inputValue);
   }

   async selectType(typeValue: string): Promise<void> {
      const inputField = this.page.getByLabel('Type');
      await inputField.selectOption(typeValue);
   }

   protected async enterByLabel(label: string, inputValue: string): Promise<void> {
      const inputField = this.page.getByLabel(label);
      await inputField.selectText();
      await inputField.fill(inputValue);
      await this.page.waitForTimeout(USER_KEY_TYPING_DELAY);
   }

   async confirm(): Promise<void> {
      if (!(await this.validationResult())) {
         throw new Error(`Unexpected validation error in TheiaSingleInputDialog: '${await this.getValidationText()}`);
      }
      await this.clickMainButton();
   }
}
