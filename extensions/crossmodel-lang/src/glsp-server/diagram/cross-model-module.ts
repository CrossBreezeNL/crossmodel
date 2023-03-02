/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import {
   BindingTarget,
   DiagramConfiguration,
   DiagramModule,
   GModelFactory,
   GModelIndex,
   InstanceMultiBinding,
   ModelState,
   OperationHandlerConstructor,
   SourceModelStorage
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
import { CrossModelChangeBoundsOperationHandler } from '../handler/change-bounds-operation-handler';
import { CrossModelCreateEdgeOperationHandler } from '../handler/create-edge-operation-handler';
import { CrossModelDeleteOperationHandler } from '../handler/delete-operation-handler';
import { CrossModelGModelFactory } from '../model/cross-model-gmodel-factory';
import { CrossModelIndex } from '../model/cross-model-index';
import { CrossModelState } from '../model/cross-model-state';
import { CrossModelStorage } from '../model/cross-model-storage';
import { CrossModelDiagramConfiguration } from './cross-model-diagram-configuration';

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
      binding.add(CrossModelChangeBoundsOperationHandler);
      binding.add(CrossModelCreateEdgeOperationHandler);
      binding.add(CrossModelDeleteOperationHandler);
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
