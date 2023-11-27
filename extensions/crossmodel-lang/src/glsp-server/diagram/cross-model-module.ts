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
   MultiBinding,
   OperationHandlerConstructor,
   SourceModelStorage
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { CrossModelAddEntityActionProvider } from '../command-palette/add-entity-action-provider.js';
import { CrossModelAddEntityOperationHandler } from '../handler/add-entity-operation-handler.js';
import { CrossModelChangeBoundsOperationHandler } from '../handler/change-bounds-operation-handler.js';
import { CrossModelCreateEdgeOperationHandler } from '../handler/create-edge-operation-handler.js';
import { CrossModelDeleteOperationHandler } from '../handler/delete-operation-handler.js';
import { CrossModelDropEntityOperationHandler } from '../handler/drop-entity-operation-handler.js';
import { CrossModelGModelFactory } from '../model/cross-model-gmodel-factory.js';
import { CrossModelIndex } from '../model/cross-model-index.js';
import { CrossModelState } from '../model/cross-model-state.js';
import { CrossModelStorage } from '../model/cross-model-storage.js';
import { CrossModelDiagramConfiguration } from './cross-model-diagram-configuration.js';

/**
 * Provides configuration about our crossmodel diagrams.
 */
@injectable()
export class CrossModelDiagramModule extends DiagramModule {
   readonly diagramType = 'crossmodel-diagram';

   protected bindDiagramConfiguration(): BindingTarget<DiagramConfiguration> {
      return CrossModelDiagramConfiguration;
   }

   protected bindSourceModelStorage(): BindingTarget<SourceModelStorage> {
      return CrossModelStorage;
   }

   protected override configureOperationHandlers(binding: InstanceMultiBinding<OperationHandlerConstructor>): void {
      super.configureOperationHandlers(binding);
      binding.add(CrossModelChangeBoundsOperationHandler); // move + resize behavior
      binding.add(CrossModelCreateEdgeOperationHandler); // create 1:1 relationship
      binding.add(CrossModelDeleteOperationHandler); // delete elements
      binding.add(CrossModelDropEntityOperationHandler);
      binding.add(CrossModelAddEntityOperationHandler);
   }

   protected override configureContextActionProviders(binding: MultiBinding<ContextActionsProvider>): void {
      super.configureContextActionProviders(binding);
      binding.add(CrossModelAddEntityActionProvider);
   }

   protected override bindGModelIndex(): BindingTarget<GModelIndex> {
      this.context.bind(CrossModelIndex).toSelf().inSingletonScope();
      return { service: CrossModelIndex };
   }

   protected bindModelState(): BindingTarget<ModelState> {
      return { service: CrossModelState };
   }

   protected bindGModelFactory(): BindingTarget<GModelFactory> {
      return CrossModelGModelFactory;
   }
}
