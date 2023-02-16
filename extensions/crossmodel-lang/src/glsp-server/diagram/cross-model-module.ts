/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import {
   ActionHandlerConstructor,
   BindingTarget,
   ComputedBoundsActionHandler,
   DiagramConfiguration,
   DiagramModule,
   GModelFactory,
   GModelIndex,
   InstanceMultiBinding,
   ModelState,
   SourceModelStorage
} from '@eclipse-glsp/server';
import { injectable } from 'inversify';
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

   protected override configureActionHandlers(binding: InstanceMultiBinding<ActionHandlerConstructor>): void {
      super.configureActionHandlers(binding);
      binding.add(ComputedBoundsActionHandler);
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
