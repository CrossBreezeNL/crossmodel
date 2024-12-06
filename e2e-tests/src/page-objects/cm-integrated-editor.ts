/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { waitForFunction } from '@eclipse-glsp/glsp-playwright';
import { TheiaEditor, TheiaTextEditor, TheiaViewData } from '@theia/playwright';
import { CMApp } from './cm-app';
import { CMCompositeEditor } from './cm-composite-editor';

export abstract class IntegratedEditor extends TheiaEditor {
   override app: CMApp;
   constructor(
      data: TheiaViewData,
      readonly parent: CMCompositeEditor
   ) {
      super(data, parent.app);
      this.app = parent.app;
   }

   override async activate(): Promise<void> {
      await this.parent.activate();
      return super.activate();
   }

   override close(waitForClosed?: boolean | undefined): Promise<void> {
      return this.parent.close(waitForClosed);
   }

   override closeWithoutSave(): Promise<void> {
      return this.parent.closeWithoutSave();
   }

   override async focus(): Promise<void> {
      await this.parent.focus();
      return super.focus();
   }

   override async save(): Promise<void> {
      await this.parent.save();
   }

   override async saveAndClose(): Promise<void> {
      await this.parent.saveAndClose();
   }

   override async undo(times?: number | undefined): Promise<void> {
      await this.parent.undo(times);
   }

   override async redo(times?: number | undefined): Promise<void> {
      await this.parent.redo(times);
   }

   override async isDirty(): Promise<boolean> {
      return this.parent.isDirty();
   }

   override async waitForVisible(): Promise<void> {
      await this.parent.waitForVisible();
      return super.waitForVisible();
   }

   override isClosable(): Promise<boolean> {
      return this.parent.isClosable();
   }

   override title(): Promise<string | undefined> {
      return this.parent.title();
   }

   async waitForDirty(): Promise<void> {
      await waitForFunction(async () => this.isDirty());
   }
}

export abstract class IntegratedTextEditor extends TheiaTextEditor {
   override app: CMApp;
   constructor(
      filePath: string,
      readonly parent: CMCompositeEditor
   ) {
      super(filePath, parent.app);
      this.app = parent.app;
   }

   override async activate(): Promise<void> {
      await this.parent.activate();
      return super.activate();
   }

   override close(waitForClosed?: boolean | undefined): Promise<void> {
      return this.parent.close(waitForClosed);
   }

   override closeWithoutSave(): Promise<void> {
      return this.parent.closeWithoutSave();
   }

   override async focus(): Promise<void> {
      await this.parent.focus();
      return super.focus();
   }

   override async save(): Promise<void> {
      await this.parent.save();
   }

   override async saveAndClose(): Promise<void> {
      await this.parent.saveAndClose();
   }

   override async undo(times?: number | undefined): Promise<void> {
      await this.parent.undo(times);
   }

   override async redo(times?: number | undefined): Promise<void> {
      await this.parent.redo(times);
   }

   override async isDirty(): Promise<boolean> {
      return this.parent.isDirty();
   }

   override async waitForVisible(): Promise<void> {
      await this.parent.waitForVisible();
      return super.waitForVisible();
   }

   override isClosable(): Promise<boolean> {
      return this.parent.isClosable();
   }

   override title(): Promise<string | undefined> {
      return this.parent.title();
   }

   async waitForDirty(): Promise<void> {
      await waitForFunction(async () => this.isDirty());
   }
}
