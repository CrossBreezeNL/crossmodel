/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { configureServerActions } from '@eclipse-glsp/client';
import { GLSPDiagramManager } from '@eclipse-glsp/theia-integration';

import { injectable } from '@theia/core/shared/inversify';
import { DiagramWidget, DiagramWidgetOptions } from 'sprotty-theia';
import { CrossModelDiagramLanguage } from '../common/crossmodel-diagram-language';
import { CrossModelDiagramWidget } from './crossmodel-diagram-widget';

/**
 * Customization of the default diagram manager to plug in our custom widget implementation (CrossModelDiagramWidget).
 */
@injectable()
export class CrossModelDiagramManager extends GLSPDiagramManager {
   override get fileExtensions(): string[] {
      return CrossModelDiagramLanguage.fileExtensions;
   }

   override get diagramType(): string {
      return CrossModelDiagramLanguage.diagramType;
   }

   get label(): string {
      return CrossModelDiagramLanguage.label;
   }

   override async createWidget(options?: any): Promise<DiagramWidget> {
      // same as super class but with custom widget implementation
      if (DiagramWidgetOptions.is(options)) {
         const clientId = this.createClientId();
         const widgetId = this.createWidgetId(options);
         const config = this.getDiagramConfiguration(options);
         const diContainer = config.createContainer(clientId);

         // do not await the result here as it blocks the Theia layout restoration for open widgets
         // instead simply check in the widget if we are already initialized
         this.diagramConnector.initializeResult.then(initializeResult =>
            configureServerActions(initializeResult, this.diagramType, diContainer)
         );

         const widget = new CrossModelDiagramWidget(
            options,
            widgetId,
            diContainer,
            this.editorPreferences,
            this.storage,
            this.theiaSelectionService,
            this.diagramConnector
         );
         widget.listenToFocusState(this.shell);
         return widget;
      }
      throw Error('DiagramWidgetFactory needs DiagramWidgetOptions but got ' + JSON.stringify(options));
   }
}
