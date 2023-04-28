/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { configureDiagramServer, GLSPDiagramConfiguration, GLSPTheiaDiagramServer } from '@eclipse-glsp/theia-integration';
import { Container } from '@theia/core/shared/inversify/index';
import { CrossModelDiagramLanguage } from '../common/crossmodel-diagram-language';
import createCrossModelDiagramContainer from './crossmodel-diagram-module';

export class CrossModelDiagramConfiguration extends GLSPDiagramConfiguration {
   diagramType: string = CrossModelDiagramLanguage.diagramType;

   doCreateContainer(widgetId: string): Container {
      // create a custom diagram container for the widget with the given id
      // GLSP will make Theia services in this container and use it to properly initialize actions and the GLSP widget
      const container = createCrossModelDiagramContainer(widgetId);
      configureDiagramServer(container, GLSPTheiaDiagramServer);
      return container;
   }
}
