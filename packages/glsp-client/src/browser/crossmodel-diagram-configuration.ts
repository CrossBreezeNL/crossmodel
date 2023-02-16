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
      const container = createCrossModelDiagramContainer(widgetId);
      configureDiagramServer(container, GLSPTheiaDiagramServer);
      return container;
   }
}
