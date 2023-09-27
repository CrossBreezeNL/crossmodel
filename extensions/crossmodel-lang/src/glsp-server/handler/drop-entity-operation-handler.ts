/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { DropEntityOperation } from '@crossbreeze/protocol';
import { Command, OperationHandler } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { URI } from 'vscode-uri';
import { CrossModelRoot, DiagramNode, isCrossModelRoot } from '../../language-server/generated/ast';
import { findAvailableNodeName } from '../../language-server/util/name-util';
import { CrossModelState } from '../model/cross-model-state';
import { CrossModelCommand } from './cross-model-command';

/**
 * An operation handler for the 'DropEntityOperation' that finds an entity for each of the given file URIs and
 * creates a new node on the diagram for each of the found entities. If multiple entities are placed on the diagram
 * their position is shifted by (10,10) so they do not fully overlap.
 */
@injectable()
export class CrossModelDropEntityOperationHandler extends OperationHandler {
    override operationType = DropEntityOperation.KIND;

    @inject(CrossModelState) protected state: CrossModelState;

    createCommand(operation: DropEntityOperation): Command {
        return new CrossModelCommand(this.state, () => this.createEntityNode(operation));
    }

    protected async createEntityNode(operation: DropEntityOperation): Promise<void> {
        const container = this.state.diagramRoot;
        let x = operation.position.x;
        let y = operation.position.y;
        for (const filePath of operation.filePaths) {
            const root = await this.state.modelService.request<CrossModelRoot>(URI.file(filePath).toString(), isCrossModelRoot);
            if (root?.entity) {
                // create node for entity
                const node: DiagramNode = {
                    $type: DiagramNode,
                    $container: container,
                    name: findAvailableNodeName(container, root.entity.name + 'Node'),
                    entity: {
                        $refText: this.state.nameProvider.getFullyQualifiedName(root.entity) || root.entity.name || '',
                        ref: root.entity
                    },
                    x: (x += 10),
                    y: (y += 10),
                    width: 10,
                    height: 10
                };
                container.nodes.push(node);
            }
        }
    }
}
