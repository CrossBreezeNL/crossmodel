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
import { EntityNodeView } from '../views';
import { EntityNode } from '../model';

const crossModelDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);
    const context = { bind, unbind, isBound, rebind };
    configureDefaultModelElements(context);

    // Bind views that can be rendered by the client-side
    // The glsp-server can send a request to render a specific view given a type, e.g. node:entity
    // The model class holds the client-side model and properties
    // The view class shows how to draw the svg element given the properties of the model class
    configureModelElement(context, 'node:entity', EntityNode, EntityNodeView);
});

export default function createCrossModelDiagramContainer(widgetId: string): Container {
    const container = createDiagramContainer(crossModelDiagramModule);

    overrideViewerOptions(container, {
        baseDiv: widgetId,
        hiddenDiv: widgetId + '_hidden'
    });

    return container;
}
