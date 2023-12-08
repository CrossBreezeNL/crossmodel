/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import {
   ConsoleLogger,
   ContainerConfiguration,
   LogLevel,
   TYPES,
   bindAsService,
   configureDefaultModelElements,
   configureModelElement,
   initializeDiagramContainer
} from '@eclipse-glsp/client';
import { TheiaGLSPSelectionForwarder } from '@eclipse-glsp/theia-integration';
import { Container, ContainerModule } from '@theia/core/shared/inversify';
import { CrossModelGLSPSelectionDataService } from './crossmodel-selection-data-service';
import { CrossModelSelectionDataService, CrossModelTheiaGLSPSelectionForwarder } from './crossmodel-selection-forwarder';
import { ENTITY_NODE_TYPE, EntityNode } from './model';
import { EntityNodeView } from './views';

const crossModelDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
   rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
   rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);
   const context = { bind, unbind, isBound, rebind };

   // Use GLSP default model elements and their views
   // For example the model element with type 'node' (DefaultTypes.NODE) is represented by an SNode and rendered as RoundedCornerNodeView
   configureDefaultModelElements(context);

   // Bind views that can be rendered by the client-side
   // The glsp-server can send a request to render a specific view given a type, e.g. node:entity
   // The model class holds the client-side model and properties
   // The view class shows how to draw the svg element given the properties of the model class
   configureModelElement(context, ENTITY_NODE_TYPE, EntityNode, EntityNodeView);

   bindAsService(bind, CrossModelSelectionDataService, CrossModelGLSPSelectionDataService);

   bind(CrossModelTheiaGLSPSelectionForwarder).toSelf().inSingletonScope();
   rebind(TheiaGLSPSelectionForwarder).toService(CrossModelTheiaGLSPSelectionForwarder);
});

export function createCrossModelDiagramContainer(...containerConfiguration: ContainerConfiguration): Container {
   return initializeCrossModelDiagramContainer(new Container(), ...containerConfiguration);
}

export function initializeCrossModelDiagramContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
   return initializeDiagramContainer(container, ...containerConfiguration, crossModelDiagramModule);
}
