/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ContainerConfiguration } from '@eclipse-glsp/protocol';
import { GLSPDiagramConfiguration } from '@eclipse-glsp/theia-integration';
import { Container } from '@theia/core/shared/inversify/index';
import { CrossModelDiagramLanguage } from '../common/crossmodel-diagram-language';
import { initializeCrossModelDiagramContainer } from './crossmodel-diagram-module';

export class CrossModelDiagramConfiguration extends GLSPDiagramConfiguration {
   diagramType: string = CrossModelDiagramLanguage.diagramType;

   configureContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
      initializeCrossModelDiagramContainer(container, ...containerConfiguration);
      return container;
   }
}
