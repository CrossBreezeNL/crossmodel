/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ContainerContext, GLSPClientContribution, GLSPTheiaFrontendModule, registerDiagramManager } from '@eclipse-glsp/theia-integration';

import { DiagramConfiguration } from 'sprotty-theia';
import { CrossModelDiagramLanguage } from '../common/crossmodel-diagram-language';
import { CrossModelClientContribution } from './crossmodel-client-contribution';
import { CrossModelDiagramConfiguration } from './crossmodel-diagram-configuration';
import { CrossModelDiagramManager } from './crossmodel-diagram-manager';

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

   override configureDiagramManager(context: ContainerContext): void {
      registerDiagramManager(context.bind, CrossModelDiagramManager);
   }
}

export default new CrossModelDiagramModule();
