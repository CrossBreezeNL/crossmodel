/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { waitForFunction } from '@eclipse-glsp/glsp-playwright';
import { ElementHandle, Locator } from '@playwright/test';
import { TheiaPageObject, TheiaView } from '@theia/playwright';
import { TheiaViewObject } from '../theia-view-object';

export const FormIcons = {
   Entity: 'codicon-git-commit',
   Relationship: 'codicon-git-compare',
   SystemDiagram: 'codicon-type-hierarchy-sub',
   Mapping: 'codicon-group-by-ref-type'
};

export type FormType = keyof typeof FormIcons;

export abstract class CMForm extends TheiaViewObject {
   protected abstract iconClass: string;
   protected typeSelector: string;

   readonly locator: Locator;
   constructor(view: TheiaView, relativeSelector: string, type: FormType) {
      super(view, relativeSelector);
      this.typeSelector = `${this.selector} span.${FormIcons[type]}`;
      this.locator = view.page.locator(this.selector);
   }

   protected typeElementHandle(): Promise<ElementHandle<SVGElement | HTMLElement> | null> {
      return this.page.$(this.typeSelector);
   }

   override async waitForVisible(): Promise<void> {
      await this.page.waitForSelector(this.typeSelector, { state: 'visible' });
   }

   override async isVisible(): Promise<boolean> {
      const viewObject = await this.typeElementHandle();
      return !!viewObject && viewObject.isVisible();
   }

   async isDirty(): Promise<boolean> {
      const title = await this.page.$(this.selector + ' .form-title:not(.p-mod-hidden)');
      const text = await title?.textContent();
      return text?.endsWith('*') ?? false;
   }

   async waitForDirty(): Promise<void> {
      await waitForFunction(async () => this.isDirty());
   }
}

export abstract class FormSection extends TheiaPageObject {
   readonly locator: Locator;

   constructor(
      readonly form: CMForm,
      sectionName: string
   ) {
      super(form.app);
      this.locator = form.locator.locator(`div.MuiAccordion-root:has(h6:has-text("${sectionName}"))`);
   }
}
