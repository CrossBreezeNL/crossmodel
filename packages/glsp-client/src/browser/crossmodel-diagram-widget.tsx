/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { getAbsolutePosition } from '@eclipse-glsp/client';
import { GLSPDiagramWidget } from '@eclipse-glsp/theia-integration';
import { Message } from '@theia/core/lib/browser';
import { TreeWidgetSelection } from '@theia/core/lib/browser/tree/tree-widget-selection';
import { FILE_NAVIGATOR_ID, FileNavigatorWidget } from '@theia/navigator/lib/browser/navigator-widget';

import { DropEntityOperation } from '@crossbreeze/protocol';
import { FileNode } from '@theia/filesystem/lib/browser';

export class CrossModelDiagramWidget extends GLSPDiagramWidget {
   protected override onAfterAttach(msg: Message): void {
      this.addEventListener(this.node, 'drop', evt => this.onDrop(evt), true);
      super.onAfterAttach(msg);
   }

   protected onDrop(event: DragEvent): void {
      const selectedFilePaths = this.getSelectedFilePaths(event);
      if (selectedFilePaths.length > 0) {
         event.stopPropagation();
         const position = getAbsolutePosition(this.editorContext.modelRoot, event);
         this.actionDispatcher.dispatch(DropEntityOperation.create(selectedFilePaths, position));
      }
   }

   protected getSelectedFilePaths(event: DragEvent): string[] {
      const data = event.dataTransfer?.getData('selected-tree-nodes');
      if (!data) {
         return [];
      }
      const selectedNodeIds: string[] = JSON.parse(data);

      const currentSelection = this.theiaSelectionService.selection;
      if (TreeWidgetSelection.is(currentSelection) && currentSelection.source.id === FILE_NAVIGATOR_ID) {
         const source = currentSelection.source as FileNavigatorWidget;
         const selectedFileNodes = selectedNodeIds.map(id => source.model.getNode(id)).filter(FileNode.is);
         return selectedFileNodes.map(node => node.uri.path.fsPath());
      }
      return [];
   }
}
