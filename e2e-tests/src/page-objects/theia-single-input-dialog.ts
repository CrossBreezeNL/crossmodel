/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { OSUtil, TheiaDialog, USER_KEY_TYPING_DELAY } from '@theia/playwright';

export class TheiaSingleInputDialog extends TheiaDialog {
    async enterSingleInput(inputValue: string): Promise<void> {
        const inputField = await this.page.waitForSelector(`${this.blockSelector} .theia-input`);
        await inputField.press(OSUtil.isMacOS ? 'Meta+a' : 'Control+a');
        await inputField.type(inputValue, { delay: USER_KEY_TYPING_DELAY });
        await this.page.waitForTimeout(USER_KEY_TYPING_DELAY);
    }

    async confirm(): Promise<void> {
        if (!(await this.validationResult())) {
            throw new Error(`Unexpected validation error in TheiaSingleInputDialog: '${await this.getValidationText()}`);
        }
        await this.clickMainButton();
    }
}
