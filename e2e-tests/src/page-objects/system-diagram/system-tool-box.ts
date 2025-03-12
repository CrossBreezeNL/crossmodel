/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import {
   GLSPToolPalette,
   GLSPToolPaletteContent,
   GLSPToolPaletteOptions,
   ToolPaletteContentGroup,
   ToolPaletteContentItem
} from '@eclipse-glsp/glsp-playwright';

export class SystemToolBox extends GLSPToolPalette {
   override readonly content: SystemToolBoxContent;

   constructor(options: GLSPToolPaletteOptions) {
      super(options);
      this.content = new SystemToolBoxContent(this);
   }
}

export interface SystemTools {
   default: 'Select & Move' | 'Hide' | 'Show Entity' | 'Create Entity' | 'Create Relationship';
}

export class SystemToolBoxContent extends GLSPToolPaletteContent {
   async toolGroups(): Promise<ToolPaletteContentGroup[]> {
      return super.groupsOfType(ToolPaletteContentGroup);
   }

   async toolGroupByHeaderText<TToolGroupKey extends keyof SystemTools>(headerText: TToolGroupKey): Promise<ToolPaletteContentGroup> {
      return super.groupByHeaderText(headerText, ToolPaletteContentGroup);
   }

   async toolElement<TToolGroupKey extends keyof SystemTools>(
      groupHeader: TToolGroupKey,
      elementText: SystemTools[TToolGroupKey]
   ): Promise<ToolPaletteContentItem<ToolPaletteContentGroup>> {
      return super.itemBy({
         groupHeaderText: groupHeader,
         groupConstructor: ToolPaletteContentGroup,
         elementText,
         elementConstructor: ToolPaletteContentItem
      });
   }
}
