/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ContainerConfiguration } from '@eclipse-glsp/protocol';
import { configureDiagramServer, GLSPDiagramConfiguration, GLSPTheiaDiagramServer } from '@eclipse-glsp/theia-integration';
import { Container } from '@theia/core/shared/inversify/index';
import { CrossModelDiagramLanguage } from '../common/crossmodel-diagram-language';
import { initializeCrossModelDiagramContainer } from './crossmodel-diagram-module';

export class CrossModelDiagramConfiguration extends GLSPDiagramConfiguration {
   diagramType: string = CrossModelDiagramLanguage.diagramType;

   override configureContainer(container: Container, widgetId: string, ...containerConfiguration: ContainerConfiguration): Container {
      // create a custom diagram container for the widget with the given id
      // GLSP will make Theia services in this container and use it to properly initialize actions and the GLSP widget
      initializeCrossModelDiagramContainer(container, widgetId, ...containerConfiguration);
      configureDiagramServer(container, GLSPTheiaDiagramServer);
      return container;
   }
}
