/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { ElementHandle } from '@playwright/test';
import { TheiaApp, TheiaEditor, isElementVisible } from '@theia/playwright';
import { CMForm } from './form/cm-form';
import { EntityForm } from './form/entiy-form';
import { RelationshipForm } from './form/relationship-form';

const CMPropertiesViewData = {
   tabSelector: '#shell-tab-property-view',
   viewSelector: '#property-view',
   viewName: 'Properties'
};

export abstract class CMPropertiesView<F extends CMForm> extends TheiaEditor {
   protected modelRootSelector = '#model-property-view';

   abstract form(): Promise<F>;

   constructor(app: TheiaApp) {
      super(CMPropertiesViewData, app);
   }

   protected async modelPropertyElement(): Promise<ElementHandle<SVGElement | HTMLElement> | null> {
      return this.page.$(this.viewSelector + ' ' + this.modelRootSelector);
   }

   isModelPropertyElement(): Promise<boolean> {
      return isElementVisible(this.modelPropertyElement());
   }

   override async isDirty(): Promise<boolean> {
      const form = await this.form();
      return form.isDirty();
   }
}

export class EntityPropertiesView extends CMPropertiesView<EntityForm> {
   async form(): Promise<EntityForm> {
      const entityForm = new EntityForm(this, this.modelRootSelector);
      await entityForm.waitForVisible();
      return entityForm;
   }
}

export class RelationshipPropertiesView extends CMPropertiesView<RelationshipForm> {
   async form(): Promise<RelationshipForm> {
      const relationshipForm = new RelationshipForm(this, this.modelRootSelector);
      await relationshipForm.waitForVisible();
      return relationshipForm;
   }
}
