/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { ATTRIBUTE_COMPARTMENT_TYPE, ENTITY_NODE_TYPE, RELATIONSHIP_EDGE_TYPE } from '@crossbreeze/protocol';
import { configureDefaultModelElements, configureModelElement, initializeDiagramContainer, selectModule } from '@eclipse-glsp/client';
import { ContainerConfiguration } from '@eclipse-glsp/protocol';
import { GLSPDiagramConfiguration } from '@eclipse-glsp/theia-integration';
import { Container } from '@theia/core/shared/inversify/index';
import { SystemDiagramLanguage } from '../../common/crossmodel-diagram-language';
import { createCrossModelDiagramModule } from '../crossmodel-diagram-module';
import { AttributeCompartment } from '../model';
import { AttributeCompartmentView } from '../views';
import { systemEdgeCreationToolModule } from './edge-creation-tool/edge-creation-tool-module';
import { EntityNode, RelationshipEdge } from './model';
import { systemSelectModule } from './select-tool/select-tool-module';
import { EntityNodeView, RelationshipEdgeView } from './views';

export class SystemDiagramConfiguration extends GLSPDiagramConfiguration {
   diagramType: string = SystemDiagramLanguage.diagramType;

   configureContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
      return initializeDiagramContainer(container, ...containerConfiguration, systemDiagramModule, systemEdgeCreationToolModule, {
         add: systemSelectModule,
         remove: selectModule
      });
   }
}

const systemDiagramModule = createCrossModelDiagramModule((bind, unbind, isBound, rebind) => {
   const context = { bind, unbind, isBound, rebind };

   // Use GLSP default model elements and their views
   // For example the model element with type 'node' (DefaultTypes.NODE) is represented by an SNode and rendered as RoundedCornerNodeView
   configureDefaultModelElements(context);

   // Bind views that can be rendered by the client-side
   // The glsp-server can send a request to render a specific view given a type, e.g. node:entity
   // The model class holds the client-side model and properties
   // The view class shows how to draw the svg element given the properties of the model class
   configureModelElement(context, ENTITY_NODE_TYPE, EntityNode, EntityNodeView);
   configureModelElement(context, RELATIONSHIP_EDGE_TYPE, RelationshipEdge, RelationshipEdgeView);
   configureModelElement(context, ATTRIBUTE_COMPARTMENT_TYPE, AttributeCompartment, AttributeCompartmentView);
});
