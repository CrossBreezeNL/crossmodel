/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import {
   ContainerContext,
   DiagramConfiguration,
   GLSPClientContribution,
   GLSPDiagramWidget,
   GLSPTheiaFrontendModule
} from '@eclipse-glsp/theia-integration';

import { CrossModelDiagramLanguage } from '../common/crossmodel-diagram-language';
import { CrossModelClientContribution } from './crossmodel-client-contribution';
import { CrossModelDiagramConfiguration } from './crossmodel-diagram-configuration';
import { CrossModelDiagramWidget } from './crossmodel-diagram-widget';

export class CrossModelDiagramModule extends GLSPTheiaFrontendModule {
   readonly diagramLanguage = CrossModelDiagramLanguage;

   bindDiagramConfiguration(context: ContainerContext): void {
      context.bind(DiagramConfiguration).to(CrossModelDiagramConfiguration);
   }

   override bindGLSPClientContribution(context: ContainerContext): void {
      // override client contribution to delay Theia frontend-backend connection for GLSP (see comments in contribution)
      context.bind(CrossModelClientContribution).toSelf().inSingletonScope();
      context.bind(GLSPClientContribution).toService(CrossModelClientContribution);
   }

   override bindDiagramWidgetFactory(context: ContainerContext): void {
      super.bindDiagramWidgetFactory(context);
      context.rebind(GLSPDiagramWidget).to(CrossModelDiagramWidget);
   }
}

export default new CrossModelDiagramModule();
