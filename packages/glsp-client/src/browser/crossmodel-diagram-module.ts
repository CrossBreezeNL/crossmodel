/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import {
    configureDefaultModelElements,
    configureModelElement,
    ConsoleLogger,
    createDiagramContainer,
    LogLevel,
    overrideViewerOptions,
    TYPES
} from '@eclipse-glsp/client';
import { Container, ContainerModule } from '@theia/core/shared/inversify';
import { EntityNode } from './model';
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
    configureModelElement(context, 'node:entity', EntityNode, EntityNodeView);
});

export default function createCrossModelDiagramContainer(widgetId: string): Container {
    // create the default diagram container with all default modules and add our own customizations
    const container = createDiagramContainer(crossModelDiagramModule);

    // The GLSP diagram widget will create Div elements with unique IDs as specified in the viewer options
    // Sprotty is using that same element to render the model
    // So we should make sure that they are truly unique by using the widget id that we already have
    overrideViewerOptions(container, {
        baseDiv: widgetId,
        hiddenDiv: widgetId + '_hidden'
    });

    return container;
}
