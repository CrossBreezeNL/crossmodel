/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ElementHandle } from '@playwright/test';
import { TheiaPageObject, TheiaView, isElementVisible } from '@theia/playwright';

export class TheiaTabbarToolbar extends TheiaPageObject {
    constructor(protected view: TheiaView) {
        super(view.app);
    }

    async isDisplayed(): Promise<boolean> {
        return isElementVisible(this.viewElement());
    }

    protected viewElement(): Promise<ElementHandle<SVGElement | HTMLElement> | null> {
        return this.page.$(this.view.viewSelector + ' .p-TabBar-toolbar');
    }
}
