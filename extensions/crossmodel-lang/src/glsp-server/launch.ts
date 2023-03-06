/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
/* eslint-disable import/no-duplicates */
import { configureELKLayoutModule } from '@eclipse-glsp/layout-elk';
import { LoggerFactory, LogLevel, MaybePromise, ServerModule } from '@eclipse-glsp/server';
import {
   createAppModule,
   defaultLaunchOptions,
   defaultSocketLaunchOptions,
   SocketServerLauncher
} from '@eclipse-glsp/server/lib/node/index';
import { Container, ContainerModule } from 'inversify';
import { CrossModelServices, CrossModelSharedServices } from '../language-server/cross-model-module';
import { CrossModelDiagramModule } from './diagram/cross-model-module';
import { CrossModelLSPServices } from './integration';
import { CrossModelLayoutConfigurator } from './layout/cross-model-layout-configurator';

export function startGLSPServer(services: CrossModelLSPServices): MaybePromise<void> {
   const launchOptions = { ...defaultLaunchOptions, logLevel: LogLevel.debug };
   const appModule = createAppModule(launchOptions);
   const lspModule = createLSPModule(services);
   const appContainer = new Container();
   appContainer.load(appModule, lspModule);

   const logger = appContainer.get<LoggerFactory>(LoggerFactory)('CrossModelServer');
   const launcher = appContainer.resolve(SocketServerLauncher);
   const elkLayoutModule = configureELKLayoutModule({ algorithms: ['layered'], layoutConfigurator: CrossModelLayoutConfigurator });
   const serverModule = new ServerModule().configureDiagramModule(new CrossModelDiagramModule(), elkLayoutModule);

   launcher.configure(serverModule);
   try {
      return launcher.start({ ...defaultSocketLaunchOptions, ...launchOptions });
   } catch (error) {
      logger.error('Error in GLSP server launcher:', error);
   }
}

export function createLSPModule(services: CrossModelLSPServices): ContainerModule {
   return new ContainerModule(bind => {
      bind(CrossModelLSPServices).toConstantValue(services);
      bind(CrossModelSharedServices).toConstantValue(services.shared);
      bind(CrossModelServices).toConstantValue(services.language);
   });
}
