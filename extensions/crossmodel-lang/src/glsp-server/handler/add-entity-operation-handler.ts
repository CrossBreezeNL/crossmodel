/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AddEntityOperation } from '@crossbreeze/protocol';
import { Command, OperationHandler } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { DiagramNode, Entity } from '../../language-server/generated/ast';
import { createNodeToEntityReference } from '../../language-server/util/ast-util';
import { findAvailableNodeName } from '../../language-server/util/name-util';
import { CrossModelState } from '../model/cross-model-state';
import { CrossModelCommand } from './cross-model-command';

/**
 * An operation handler for the 'AddEntityOperation' that resolves the referenced entity by name and places it in a new node on the diagram.
 */
@injectable()
export class CrossModelAddEntityOperationHandler extends OperationHandler {
    override operationType = AddEntityOperation.KIND;

    @inject(CrossModelState) protected state: CrossModelState;

    createCommand(operation: AddEntityOperation): Command {
        return new CrossModelCommand(this.state, () => this.createEntityNode(operation));
    }

    protected async createEntityNode(operation: AddEntityOperation): Promise<void> {
        const container = this.state.diagramRoot;
        const refInfo = createNodeToEntityReference(container);
        const scope = this.state.services.language.references.ScopeProvider.getScope(refInfo);
        const entityDescription = scope.getElement(operation.entityName);
        if (entityDescription) {
            // create node for entity
            const node: DiagramNode = {
                $type: DiagramNode,
                $container: container,
                name: findAvailableNodeName(container, entityDescription.name + 'Node'),
                for: {
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
