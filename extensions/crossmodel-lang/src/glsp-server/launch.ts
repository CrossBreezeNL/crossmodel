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

/**
 * Launches a GLSP server with access to the given language services on the default port.
 *
 * @param services language services
 * @returns a promise that is resolved as soon as the server is shut down or rejects if an error occurs
 */
export function startGLSPServer(services: CrossModelLSPServices): MaybePromise<void> {
   const launchOptions = { ...defaultLaunchOptions, logLevel: LogLevel.debug };

   // create module based on launch options, e.g., logging etc.
   const appModule = createAppModule(launchOptions);
   // create custom module to bind language services to support injection within GLSP classes
   const lspModule = createLSPModule(services);

   // create app container will all necessary modules and retrieve launcher
   const appContainer = new Container();
   appContainer.load(appModule, lspModule);

   const logger = appContainer.get<LoggerFactory>(LoggerFactory)('CrossModelServer');
   const launcher = appContainer.resolve(SocketServerLauncher);

   // use Eclipse Layout Kernel with our custom layered layout configuration
   const elkLayoutModule = configureELKLayoutModule({ algorithms: ['layered'], layoutConfigurator: CrossModelLayoutConfigurator });

   // create server module with our cross model diagram
   const serverModule = new ServerModule().configureDiagramModule(new CrossModelDiagramModule(), elkLayoutModule);

   launcher.configure(serverModule);
   try {
      return launcher.start({ ...defaultSocketLaunchOptions, ...launchOptions });
   } catch (error) {
      logger.error('Error in GLSP server launcher:', error);
   }
}

/**
 * Custom module to bind language services so that they can be injected in other classes created through DI.
 *
 * @param services language services
 * @returns container module
 */
export function createLSPModule(services: CrossModelLSPServices): ContainerModule {
   return new ContainerModule(bind => {
      bind(CrossModelLSPServices).toConstantValue(services);
      bind(CrossModelSharedServices).toConstantValue(services.shared);
      bind(CrossModelServices).toConstantValue(services.language);
   });
}
