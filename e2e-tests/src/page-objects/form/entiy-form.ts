/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { defined } from '@eclipse-glsp/glsp-playwright';
import { Locator } from '@playwright/test';
import { TheiaPageObject } from '@theia/playwright';
import { TheiaView } from '@theia/playwright/lib/theia-view';
import { CMForm, FormIcons, FormSection } from './cm-form';

export class EntityForm extends CMForm {
   protected override iconClass = FormIcons.Entity;

   readonly generalSection: EntityGeneralSection;
   readonly attributesSection: EntityAttributesSection;

   constructor(view: TheiaView, relativeSelector: string) {
      super(view, relativeSelector, 'Entity');
      this.generalSection = new EntityGeneralSection(this);
      this.attributesSection = new EntityAttributesSection(this);
   }
}

export class EntityGeneralSection extends FormSection {
   constructor(form: EntityForm) {
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

export class EntityAttributesSection extends FormSection {
   readonly addButtonLocator: Locator;
   constructor(form: EntityForm) {
      super(form, 'Attributes');
      this.addButtonLocator = this.locator.locator('button:has-text("Add Attribute")');
   }

   async addAttribute(): Promise<EntityAttribute> {
      await this.addButtonLocator.click();
      await this.page.keyboard.press('Enter');
      const lastAttribute = this.locator.locator('div[data-rowindex]').last();
      await this.page.waitForTimeout(150);
      return new EntityAttribute(lastAttribute, this);
   }

   async getAllAttributes(): Promise<EntityAttribute[]> {
      const attributeLocators = await this.locator.locator('div[data-rowindex]').all();
      return attributeLocators.map(locator => new EntityAttribute(locator, this));
   }

   async getAttribute(name: string): Promise<EntityAttribute> {
      return defined(await this.findAttribute(name));
   }

   async findAttribute(name: string): Promise<EntityAttribute | undefined> {
      const attributeLocators = await this.locator.locator('div[data-rowindex]').all();
      for (const locator of attributeLocators) {
         const attribute = new EntityAttribute(locator, this);
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

export interface EntityAttributeProperties {
   name: string;
   datatype: string;
   identifier: boolean;
   description: string;
}

export const EntityDatatype = {
   Integer: 'Integer',
   Float: 'Float',
   Char: 'Char',
   Varchar: 'Varchar',
   Bool: 'Bool',
   Text: 'Text'
} as const;

export type EntityDatatype = keyof typeof EntityDatatype;

export class EntityAttribute extends TheiaPageObject {
   constructor(
      readonly locator: Locator,
      section: EntityAttributesSection
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

   async getProperties(): Promise<EntityAttributeProperties> {
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
   }

   async getDatatype(): Promise<EntityDatatype> {
      return defined(await this.dataType.textContent()) as EntityDatatype;
   }

   async setDatatype(datatype: EntityDatatype): Promise<void> {
      await this.dataType.press('Enter');
      await this.dataType.getByRole('combobox').click();
      const selectionOverlay = this.page.locator('div[role="presentation"][id="menu-"]');
      await selectionOverlay.locator(`li[data-value="${datatype}"]`).press('Enter');
   }

   async isIdentifier(): Promise<boolean> {
      return (await this.identifierLocator.locator('svg[data-testid="CheckBoxOutlinedIcon"]').count()) === 1;
   }

   async toggleIdentifier(): Promise<void> {
      await this.identifierLocator.click({ clickCount: 2 });
      await this.identifierLocator.click();
   }

   async getDescription(): Promise<string> {
      return (await this.descriptionLocator.textContent()) ?? '';
   }

   async setDescription(description: string): Promise<void> {
      await this.descriptionLocator.click({ clickCount: 2 });
      await this.descriptionLocator.locator('input').fill(description);
      await this.descriptionLocator.press('Enter');
   }

   async delete(): Promise<void> {
      const deleteButton = this.actionsLocator.locator('button[aria-label="Delete"]');
      await deleteButton.click();
   }
}
