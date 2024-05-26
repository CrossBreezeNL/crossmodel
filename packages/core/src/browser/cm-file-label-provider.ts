/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { ModelService } from '@crossbreeze/model-service/lib/common';
import { ModelStructure } from '@crossbreeze/protocol';
import { Emitter, MaybePromise } from '@theia/core';
import { DepthFirstTreeIterator, LabelProvider, LabelProviderContribution, Tree, TreeDecorator, TreeNode } from '@theia/core/lib/browser';
import { WidgetDecoration } from '@theia/core/lib/browser/widget-decoration';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileStatNode } from '@theia/filesystem/lib/browser';

@injectable()
export class CrossModelLabelProvider implements LabelProviderContribution, TreeDecorator {
   id = 'CrossModelLabelProvider';

   @inject(LabelProvider) protected readonly labelProvider: LabelProvider;
   @inject(ModelService) protected readonly modelService: ModelService;

   protected readonly decorationsChangedEmitter = new Emitter();
   readonly onDidChangeDecorations = this.decorationsChangedEmitter.event;

   @postConstruct()
   protected init(): void {
      this.modelService.onReady(() => this.fireDidChangeDecorations(tree => this.collectDecorators(tree)));
      this.modelService.onSystemUpdate(() => this.fireDidChangeDecorations(tree => this.collectDecorators(tree)));
   }

   canHandle(element: object): number {
      return FileStatNode.is(element) ? 100 : 0;
   }

   getIcon(node: FileStatNode): string {
      if (this.isSystemDirectory(node)) {
         return ModelStructure.System.ICON + ' default-folder-icon';
      }
      if (this.isSystemDirectory(node.parent) && node.fileStat.name === ModelStructure.Entity.FOLDER) {
         return ModelStructure.Entity.ICON + ' default-folder-icon';
      }
      if (this.isSystemDirectory(node.parent) && node.fileStat.name === ModelStructure.Relationship.FOLDER) {
         return ModelStructure.Relationship.ICON + ' default-folder-icon';
      }
      if (this.isSystemDirectory(node.parent) && node.fileStat.name === ModelStructure.SystemDiagram.FOLDER) {
         return ModelStructure.SystemDiagram.ICON + ' default-folder-icon';
      }
      if (this.isSystemDirectory(node.parent) && node.fileStat.name === ModelStructure.Mapping.FOLDER) {
         return ModelStructure.Mapping.ICON + ' default-folder-icon';
      }
      return this.labelProvider.getIcon(node.fileStat);
   }

   protected fireDidChangeDecorations(event: (tree: Tree) => Map<string, WidgetDecoration.Data>): void {
      this.decorationsChangedEmitter.fire(event);
   }

   decorations(tree: Tree): MaybePromise<Map<string, WidgetDecoration.Data>> {
      return this.collectDecorators(tree);
   }

   // Add workspace root as caption suffix and italicize if PreviewWidget
   protected collectDecorators(tree: Tree): Map<string, WidgetDecoration.Data> {
      const result = new Map<string, WidgetDecoration.Data>();
      if (tree.root === undefined) {
         return result;
      }
      for (const node of new DepthFirstTreeIterator(tree.root)) {
         if (FileStatNode.is(node) && this.isSystemDirectory(node)) {
            const decorations: WidgetDecoration.Data = {
               captionSuffixes: [{ data: 'System' }]
            };
            result.set(node.id, decorations);
         }
      }
      return result;
   }

   protected isSystemDirectory(node?: TreeNode): boolean {
      return (
         FileStatNode.is(node) &&
         node.fileStat.isDirectory &&
         this.modelService.systems.some(system => system.directory === node.fileStat.resource.path.fsPath())
      );
   }
}
