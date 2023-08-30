/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import {
    ActionHandlerConstructor,
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
import { CrossModelAddEntityActionProvider } from '../command-palette/add-entity-action-provider';
import { CrossModelAddEntityOperationHandler } from '../handler/add-entity-operation-handler';
import { CrossModelChangeBoundsOperationHandler } from '../handler/change-bounds-operation-handler';
import { CrossModelCreateEdgeOperationHandler } from '../handler/create-edge-operation-handler';
import { CrossModelDeleteOperationHandler } from '../handler/delete-operation-handler';
import { CrossModelDropEntityOperationHandler } from '../handler/drop-entity-operation-handler';
import { CrossModelGModelFactory } from '../model/cross-model-gmodel-factory';
import { CrossModelIndex } from '../model/cross-model-index';
import { CrossModelState } from '../model/cross-model-state';
import { CrossModelStorage } from '../model/cross-model-storage';
import { CrossModelDiagramConfiguration } from './cross-model-diagram-configuration';
import { CrossModelUpdateClientActionHandler } from '../handler/update-glsp-client-handler';

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

    protected override configureActionHandlers(binding: InstanceMultiBinding<ActionHandlerConstructor>): void {
        super.configureActionHandlers(binding);
        binding.add(CrossModelUpdateClientActionHandler);
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
