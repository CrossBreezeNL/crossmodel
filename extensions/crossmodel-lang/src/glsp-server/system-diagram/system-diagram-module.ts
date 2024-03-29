/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import {
   BindingTarget,
   ContextActionsProvider,
   DiagramConfiguration,
   DiagramModule,
   GModelFactory,
   GModelIndex,
   InstanceMultiBinding,
   ModelState,
   ModelSubmissionHandler,
   MultiBinding,
   OperationHandlerConstructor,
   SourceModelStorage,
   bindAsService
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { CrossModelIndex } from '../common/cross-model-index.js';
import { CrossModelState } from '../common/cross-model-state.js';
import { CrossModelStorage } from '../common/cross-model-storage.js';
import { CrossModelSubmitHandler } from '../common/cross-model-submission-handler.js';
import { SystemDiagramAddEntityActionProvider } from './command-palette/add-entity-action-provider.js';
import { SystemDiagramAddEntityOperationHandler } from './handler/add-entity-operation-handler.js';
import { SystemDiagramChangeBoundsOperationHandler } from './handler/change-bounds-operation-handler.js';
import { SystemDiagramCreateEdgeOperationHandler } from './handler/create-edge-operation-handler.js';
import { SystemDiagramDeleteOperationHandler } from './handler/delete-operation-handler.js';
import { SystemDiagramDropEntityOperationHandler } from './handler/drop-entity-operation-handler.js';
import { SystemDiagramGModelFactory } from './model/system-diagram-gmodel-factory.js';
import { SystemModelState } from './model/system-model-state.js';
import { SystemDiagramConfiguration } from './system-diagram-configuration.js';
import { SystemModelIndex } from './model/system-model-index.js';

/**
 * Provides configuration about our system diagrams.
 */
@injectable()
export class SystemDiagramModule extends DiagramModule {
   readonly diagramType = 'system-diagram';

   protected bindDiagramConfiguration(): BindingTarget<DiagramConfiguration> {
      return SystemDiagramConfiguration;
   }

   protected bindSourceModelStorage(): BindingTarget<SourceModelStorage> {
      return CrossModelStorage;
   }

   protected override configureOperationHandlers(binding: InstanceMultiBinding<OperationHandlerConstructor>): void {
      super.configureOperationHandlers(binding);
      binding.add(SystemDiagramChangeBoundsOperationHandler); // move + resize behavior
      binding.add(SystemDiagramCreateEdgeOperationHandler); // create 1:1 relationship
      binding.add(SystemDiagramDeleteOperationHandler); // delete elements
      binding.add(SystemDiagramDropEntityOperationHandler);
      binding.add(SystemDiagramAddEntityOperationHandler);
   }

   protected override configureContextActionProviders(binding: MultiBinding<ContextActionsProvider>): void {
      super.configureContextActionProviders(binding);
      binding.add(SystemDiagramAddEntityActionProvider);
   }

   protected override bindGModelIndex(): BindingTarget<GModelIndex> {
      bindAsService(this.context, CrossModelIndex, SystemModelIndex);
      return { service: SystemModelIndex };
   }

   protected bindModelState(): BindingTarget<ModelState> {
      bindAsService(this.context, CrossModelState, SystemModelState);
      return { service: SystemModelState };
   }

   protected bindGModelFactory(): BindingTarget<GModelFactory> {
      return SystemDiagramGModelFactory;
   }

   protected override bindModelSubmissionHandler(): BindingTarget<ModelSubmissionHandler> {
      return CrossModelSubmitHandler;
   }
}
