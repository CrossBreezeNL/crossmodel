/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ElementHandle } from '@playwright/test';
import { TheiaPageObject, TheiaView } from '@theia/playwright';

export class TheiaViewObject extends TheiaPageObject {
   protected selector: string;

   constructor(
      public view: TheiaView,
      protected relativeSelector: string
   ) {
      super(view.app);
      this.selector = this.view.viewSelector + ' ' + relativeSelector;
   }

   protected async objectElementHandle(): Promise<ElementHandle<SVGElement | HTMLElement> | null> {
      return this.page.$(this.selector);
   }

   async waitForVisible(): Promise<void> {
      await this.page.waitForSelector(this.selector, { state: 'visible' });
   }

   async isVisible(): Promise<boolean> {
      const viewObject = await this.objectElementHandle();
      return !!viewObject && viewObject.isVisible();
   }
}
