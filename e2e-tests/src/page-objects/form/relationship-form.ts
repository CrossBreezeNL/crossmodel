/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { TheiaView } from '@theia/playwright';
import { CMForm, FormIcons, FormSection } from './cm-form';

export class RelationshipForm extends CMForm {
   protected override iconClass = FormIcons.Relationship;

   readonly generalSection: RelationshipGeneralSection;

   constructor(view: TheiaView, relativeSelector: string) {
      super(view, relativeSelector, 'Relationship');
      this.generalSection = new RelationshipGeneralSection(this);
   }
}

export class RelationshipGeneralSection extends FormSection {
   constructor(form: RelationshipForm) {
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
}
