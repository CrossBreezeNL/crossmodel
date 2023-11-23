/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AddEntityOperation } from '@crossbreeze/protocol';
import { Command, JsonOperationHandler, ModelState } from '@eclipse-glsp/server';
import { injectable, inject } from 'inversify';
import { DiagramNode, Entity } from '../../language-server/generated/ast.js';
import { createNodeToEntityReference } from '../../language-server/util/ast-util.js';
import { findAvailableNodeName } from '../../language-server/util/name-util.js';
import { CrossModelState } from '../model/cross-model-state.js';
import { CrossModelCommand } from './cross-model-command.js';

/**
 * An operation handler for the 'AddEntityOperation' that resolves the referenced entity by name and places it in a new node on the diagram.
 */
@injectable()
export class CrossModelAddEntityOperationHandler extends JsonOperationHandler {
    override operationType = AddEntityOperation.KIND;
    @inject(ModelState) protected override modelState!: CrossModelState;

    createCommand(operation: AddEntityOperation): Command {
        return new CrossModelCommand(this.modelState, () => this.createEntityNode(operation));
    }

    protected async createEntityNode(operation: AddEntityOperation): Promise<void> {
        const container = this.modelState.diagramRoot;
        const refInfo = createNodeToEntityReference(container);
        const scope = this.modelState.services.language.references.ScopeProvider.getScope(refInfo);
        const entityDescription = scope.getElement(operation.entityName);

        if (entityDescription) {
            // create node for entity
            const node: DiagramNode = {
                $type: DiagramNode,
                $container: container,
                name: findAvailableNodeName(container, entityDescription.name + 'Node'),
                entity: {
                    $refText: entityDescription.name,
                    ref: entityDescription.node as Entity | undefined
                },
                x: operation.position.x,
                y: operation.position.y,
                width: 10,
                height: 10
            };
            container.nodes.push(node);
        }
    }
}
