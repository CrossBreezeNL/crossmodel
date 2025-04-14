/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { defined, waitForFunction } from '@eclipse-glsp/glsp-playwright';
import { Locator } from '@playwright/test';
import { TheiaPageObject } from '@theia/playwright';
import { TheiaView } from '@theia/playwright/lib/theia-view';
import { CMForm, FormIcons, FormSection } from './cm-form';

export class LogicalEntityForm extends CMForm {
   protected override iconClass = FormIcons.LogicalEntity;

   readonly generalSection: LogicalEntityGeneralSection;
   readonly attributesSection: LogicalEntityAttributesSection;

   constructor(view: TheiaView, relativeSelector: string) {
      super(view, relativeSelector, 'LogicalEntity');
      this.generalSection = new LogicalEntityGeneralSection(this);
      this.attributesSection = new LogicalEntityAttributesSection(this);
   }
}

export class LogicalEntityGeneralSection extends FormSection {
   constructor(form: LogicalEntityForm) {
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

export class LogicalEntityAttributesSection extends FormSection {
   readonly addButtonLocator: Locator;
   constructor(form: LogicalEntityForm) {
      super(form, 'Attributes');
      this.addButtonLocator = this.locator.locator('button:has-text("Add Attribute")');
   }

   async addAttribute(): Promise<LogicalAttribute> {
      await this.addButtonLocator.click();
      await this.page.keyboard.press('Enter');
      const lastAttribute = this.locator.locator('div[data-rowindex]').last();
      await this.page.waitForTimeout(150);
      return new LogicalAttribute(lastAttribute, this);
   }

   async getAllAttributes(): Promise<LogicalAttribute[]> {
      const attributeLocators = await this.locator.locator('div[data-rowindex]').all();
      return attributeLocators.map(locator => new LogicalAttribute(locator, this));
   }

   async getAttribute(name: string): Promise<LogicalAttribute> {
      return defined(await this.findAttribute(name));
   }

   async findAttribute(name: string): Promise<LogicalAttribute | undefined> {
      const attributeLocators = await this.locator.locator('div[data-rowindex]').all();
      for (const locator of attributeLocators) {
         const attribute = new LogicalAttribute(locator, this);
         if ((await attribute.getName()) === name) {
            return attribute;
         }
      }
      return undefined;
   }

   async deleteAttribute(name: string): Promise<void> {
      const attribute = await this.findAttribute(name);
      if (attribute) {
         await attribute.delete();
      }
   }
}

export interface LogicalAttributeProperties {
   name: string;
   datatype: string;
   identifier: boolean;
   description: string;
}

export const LogicalAttributeDatatype = {
   // Basic data types
   Text: 'Text',
   Boolean: 'Boolean',
   Integer: 'Integer',
   Decimal: 'Decimal',

   // Date and time data types
   Date: 'Date',
   Time: 'Time',
   DateTime: 'DateTime',

   // Identifiers & key types
   Guid: 'Guid',

   // Specialized data types
   Binary: 'Binary',
   Location: 'Location'
} as const;

export type LogicalAttributeDatatype = keyof typeof LogicalAttributeDatatype;

export class LogicalAttribute extends TheiaPageObject {
   constructor(
      readonly locator: Locator,
      section: LogicalEntityAttributesSection
   ) {
      super(section.app);
   }

   protected get nameLocator(): Locator {
      return this.locator.locator('[data-field="name"]');
   }

   protected get dataType(): Locator {
      return this.locator.locator('[data-field="datatype"]');
   }

   protected get identifierLocator(): Locator {
      return this.locator.locator('[data-field="identifier"]');
   }

   protected get descriptionLocator(): Locator {
      return this.locator.locator('[data-field="description"]');
   }

   protected get actionsLocator(): Locator {
      return this.locator.locator('div[data-field="actions"]');
   }

   async getProperties(): Promise<LogicalAttributeProperties> {
      return {
         name: await this.getName(),
         datatype: await this.getDatatype(),
         identifier: await this.isIdentifier(),
         description: await this.getDescription()
      };
   }

   async getName(): Promise<string> {
      return (await this.nameLocator.textContent()) ?? '';
   }

   async setName(name: string): Promise<void> {
      await this.nameLocator.press('Enter');
      await this.nameLocator.locator('input').fill(name);
      await this.nameLocator.press('Enter');
      await waitForFunction(async () => (await this.getName()) === name);
   }

   async getDatatype(): Promise<LogicalAttributeDatatype> {
      return defined(await this.dataType.textContent()) as LogicalAttributeDatatype;
   }

   async setDatatype(datatype: LogicalAttributeDatatype): Promise<void> {
      await this.dataType.press('Enter');
      await this.dataType.getByRole('combobox').click();
      const selectionOverlay = this.page.locator('div[role="presentation"][id="menu-"]');
      await selectionOverlay.locator(`li[data-value="${datatype}"]`).press('Enter');
      await waitForFunction(async () => (await this.getDatatype()) === datatype);
   }

   async isIdentifier(): Promise<boolean> {
      return (await this.identifierLocator.locator('svg[data-testid="CheckBoxOutlinedIcon"]').count()) === 1;
   }

   async toggleIdentifier(): Promise<void> {
      const isIdentifier = await this.isIdentifier();
      await this.identifierLocator.press('Enter');
      await this.identifierLocator.click();
      await this.identifierLocator.press('Enter');
      await waitForFunction(async () => (await this.isIdentifier()) !== isIdentifier);
   }

   async getDescription(): Promise<string> {
      return (await this.descriptionLocator.textContent()) ?? '';
   }

   async setDescription(description: string): Promise<void> {
      await this.descriptionLocator.press('Enter');
      await this.descriptionLocator.locator('input').fill(description);
      await this.descriptionLocator.press('Enter');
      await waitForFunction(async () => (await this.getDescription()) === description);
   }

   async delete(): Promise<void> {
      const deleteButton = this.actionsLocator.locator('button[aria-label="Delete"]');
      await deleteButton.click();
   }
}
