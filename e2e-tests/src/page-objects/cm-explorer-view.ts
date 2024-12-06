/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { TheiaApp, TheiaExplorerFileStatNode, TheiaExplorerView } from '@theia/playwright';
import { CMMTabBarToolbar } from './cm-tab-bar-toolbar';

export class CMExplorerView extends TheiaExplorerView {
   public readonly tabBarToolbar: CMMTabBarToolbar;

   constructor(app: TheiaApp) {
      super(app);
      this.tabBarToolbar = new CMMTabBarToolbar(this);
   }

   /**
    * The `existsFileNode` method implementation of the `TheiaExplorerView` PO don't
    * behave as expected. If a node does not exist they will throw an errors instead of
    * returning `false`.
    * This method is a workaround and allows us to quickly check if a file node is visible
    */
   async findTreeNode(path: string): Promise<TheiaExplorerFileStatNode | undefined> {
      const fullPathSelector = this.treeNodeSelector(path);
      const treeNodeElement = await this.page.$(fullPathSelector);
      if (treeNodeElement) {
         return new TheiaExplorerFileStatNode(treeNodeElement, this);
      }
      return undefined;
   }

   /**
    * Override the `deleteNode` method to wait for the file nodes to decrease after a node is deleted
    */
   override async deleteNode(path: string, confirm?: boolean | undefined, nodeSegmentLabel?: string | undefined): Promise<void> {
      const fileStatElements = await this.visibleFileStatNodes();
      await super.deleteNode(path, confirm, nodeSegmentLabel);
      await this.waitForFileNodesToDecrease(fileStatElements.length);
   }
}
