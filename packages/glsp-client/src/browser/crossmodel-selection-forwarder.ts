/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { GModelRoot } from '@eclipse-glsp/client';
import { GlspSelection, GlspSelectionData, TheiaGLSPSelectionForwarder, getDiagramWidget } from '@eclipse-glsp/theia-integration';
import { ApplicationShell } from '@theia/core/lib/browser';
import { inject, injectable, optional, postConstruct } from '@theia/core/shared/inversify';

@injectable()
export abstract class CrossModelSelectionDataService {
   abstract getSelectionData(root: Readonly<GModelRoot>, selectedElementIds: string[]): Promise<GlspSelectionData>;
}

@injectable()
export class CrossModelTheiaGLSPSelectionForwarder extends TheiaGLSPSelectionForwarder {
   @inject(CrossModelSelectionDataService)
   @optional()
   protected readonly dataService?: CrossModelSelectionDataService;

   @inject(ApplicationShell)
   protected shell: ApplicationShell;

   @postConstruct()
   protected init(): void {
      this.shell.onDidChangeActiveWidget(() => {
         const activeDiagramWidget = getDiagramWidget(this.shell);
         if (activeDiagramWidget) {
            // re-store selection from diagram to the global scope
            this.selectionChanged(
               activeDiagramWidget.editorContext.modelRoot,
               activeDiagramWidget.editorContext.selectedElements.map(element => element.id)
            );
         }
      });
   }

   override selectionChanged(root: Readonly<GModelRoot>, selectedElements: string[]): void {
      this.handleSelectionChanged(selectedElements, root);
   }

   override async handleSelectionChanged(selectedElementsIDs: string[], root?: Readonly<GModelRoot>): Promise<void> {
      const sourceUri = await this.getSourceUri();
      const additionalSelectionData = (await this.dataService?.getSelectionData(root!, selectedElementsIDs)) ?? undefined;
      const glspSelection: GlspSelection = {
         selectedElementsIDs,
         additionalSelectionData,
         widgetId: this.viewerOptions.baseDiv,
         sourceUri: sourceUri
      };
      this.theiaSelectionService.selection = glspSelection;
   }
}
