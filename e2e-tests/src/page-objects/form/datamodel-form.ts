/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { TheiaView } from '@theia/playwright';
import { CMForm, FormIcons, FormSection } from './cm-form';

export class DataModelForm extends CMForm {
   protected override iconClass = FormIcons.Relationship;

   readonly generalSection: DataModelGeneralSection;

   constructor(view: TheiaView, relativeSelector: string) {
      super(view, relativeSelector, 'DataModel');
      this.generalSection = new DataModelGeneralSection(this);
   }
}

export class DataModelGeneralSection extends FormSection {
   constructor(form: DataModelForm) {
      super(form, 'General');
   }

   async getName(): Promise<string> {
      return this.locator.getByLabel('Name').inputValue();
   }

   async setName(name: string): Promise<void> {
      await this.locator.getByLabel('Name').fill(name);
      return this.page.waitForTimeout(250);
   }

   async getDescription(): Promise<string> {
      return this.locator.getByLabel('Description').inputValue();
   }

   async setDescription(description: string): Promise<void> {
      await this.locator.getByLabel('Description').fill(description);
      return this.page.waitForTimeout(250);
   }

   async getType(): Promise<string> {
      return this.locator.getByLabel('Type').inputValue();
   }

   async setType(type: string): Promise<void> {
      const input = await this.locator.getByLabel('Type');
      await input.fill(type);
      return this.page.waitForTimeout(250);
   }

   async getVersion(): Promise<string> {
      return this.locator.getByLabel('Version').inputValue();
   }

   async setVersion(version: string): Promise<void> {
      await this.locator.getByLabel('Version').fill(version);
      return this.page.waitForTimeout(250);
   }
}
