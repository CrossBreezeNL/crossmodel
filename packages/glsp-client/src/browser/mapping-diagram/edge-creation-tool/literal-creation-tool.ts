/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { TARGET_ATTRIBUTE_MAPPING_EDGE_TYPE } from '@crossbreeze/protocol';
import {
   CreateEdgeOperation,
   DOMHelper,
   GModelRoot,
   LabeledAction,
   MousePositionTracker,
   Point,
   TYPES,
   ValidationDecorator,
   ValidationStatus,
   ViewerOptions,
   Writable,
   getAbsoluteClientBounds
} from '@eclipse-glsp/client';
import { BaseAutocompletePalette } from '@eclipse-glsp/client/lib/base/auto-complete/base-autocomplete-palette';
import { feedbackEdgeEndId } from '@eclipse-glsp/client/lib/features/tools/edge-creation/dangling-edge-feedback';
import { inject } from '@theia/core/shared/inversify';
import { SModelRootImpl } from 'sprotty';

export class LiteralCreationPalette extends BaseAutocompletePalette {
   static readonly ID = 'literal-creation-editor';

   @inject(TYPES.ViewerOptions)
   protected viewerOptions: ViewerOptions;

   @inject(TYPES.DOMHelper)
   protected domHelper: DOMHelper;

   @inject(MousePositionTracker)
   protected mousePositionTracker: MousePositionTracker;

   protected targetAttributeId: string;

   id(): string {
      return LiteralCreationPalette.ID;
   }

   protected override initializeContents(containerElement: HTMLElement): void {
      super.initializeContents(containerElement);
      containerElement.classList.add('literal-creation-palette');

      this.autocompleteWidget.inputField.placeholder = 'Provide a number or String value';

      this.autocompleteWidget.configureValidation(
         { validate: async () => ValidationStatus.NONE },
         new ValidationDecorator(containerElement)
      );
      this.autocompleteWidget.configureTextSubmitHandler({
         executeFromTextOnlyInput: (input: string) => this.executeFromTextOnlyInput(input)
      });
   }

   protected override onBeforeShow(containerElement: HTMLElement, root: Readonly<GModelRoot>, ...contextElementIds: string[]): void {
      this.targetAttributeId = contextElementIds[0];
      this.autocompleteWidget.inputField.value = '';
      this.setPosition(root, containerElement);
   }

   protected setPosition(root: Readonly<GModelRoot>, containerElement: HTMLElement): void {
      const position: Writable<Point> = this.mousePositionTracker.lastPositionOnDiagram ?? { x: 0, y: 0 };

      const edgeEnd = root.index.getById(feedbackEdgeEndId(root));
      if (edgeEnd) {
         const bounds = getAbsoluteClientBounds(edgeEnd, this.domHelper, this.viewerOptions);
         position.x = bounds.x;
         position.y = bounds.y;
      }

      containerElement.style.left = `${position.x}px`;
      containerElement.style.top = `${position.y}px`;
      containerElement.style.width = '200px';
   }

   protected executeFromTextOnlyInput(input: string): void {
      this.actionDispatcher.dispatch(
         CreateEdgeOperation.create({
            elementTypeId: TARGET_ATTRIBUTE_MAPPING_EDGE_TYPE,
            targetElementId: this.targetAttributeId,
            sourceElementId: input,
            args: {
               isLiteral: true
            }
         })
      );
   }

   protected override async retrieveSuggestions(_root: Readonly<SModelRootImpl>, _input: string): Promise<LabeledAction[]> {
      return [];
   }
}
