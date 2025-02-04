/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { ENTITY_NODE_TYPE } from '@crossbreeze/protocol';
import {
   Action,
   ActionDispatcher,
   Command,
   CreateNodeOperation,
   JsonCreateNodeOperationHandler,
   MaybePromise,
   ModelState,
   Point
} from '@eclipse-glsp/server';
import { inject, injectable } from '@theia/core/shared/inversify';
import { URI, Utils as UriUtils } from 'vscode-uri';
import { CrossModelRoot, Entity, EntityNode } from '../../../language-server/generated/ast.js';
import { Utils } from '../../../language-server/util/uri-util.js';
import { CrossModelCommand } from '../../common/cross-model-command.js';
import { SystemModelState } from '../model/system-model-state.js';

@injectable()
export class SystemDiagramCreateEntityOperationHandler extends JsonCreateNodeOperationHandler {
   override label = 'Create Entity';
   elementTypeIds = [ENTITY_NODE_TYPE];

   @inject(ModelState) protected declare modelState: SystemModelState;
   @inject(ActionDispatcher) protected actionDispatcher!: ActionDispatcher;

   override createCommand(operation: CreateNodeOperation): MaybePromise<Command | undefined> {
      return new CrossModelCommand(this.modelState, () => this.createNode(operation));
   }

   protected async createNode(operation: CreateNodeOperation): Promise<void> {
      const entity = await this.createAndSaveEntity(operation);
      if (!entity) {
         return;
      }
      const container = this.modelState.systemDiagram;
      const location = this.getLocation(operation) ?? Point.ORIGIN;
      const node: EntityNode = {
         $type: EntityNode,
         $container: container,
         id: this.modelState.idProvider.findNextId(EntityNode, entity.name + 'Node', container),
         entity: {
            $refText: this.modelState.idProvider.getNodeId(entity) || entity.id || '',
            ref: entity
         },
         x: location.x,
         y: location.y,
         width: 10,
         height: 10,
         customProperties: []
      };
      container.nodes.push(node);
      this.actionDispatcher.dispatchAfterNextUpdate({
         kind: 'EditLabel',
         labelId: `${this.modelState.index.createId(node)}_label`
      } as Action);
   }

   /**
    * Creates a new entity and stores it on a file on the file system.
    */
   protected async createAndSaveEntity(operation: CreateNodeOperation): Promise<Entity | undefined> {
      // create entity, serialize and re-read to ensure everything is up to date and linked properly
      const entityRoot: CrossModelRoot = { $type: 'CrossModelRoot' };
      const id = this.modelState.idProvider.findNextId(Entity, 'NewEntity');
      const entity: Entity = {
         $type: 'Entity',
         $container: entityRoot,
         id,
         name: id,
         attributes: [],
         customProperties: [],
         superEntities: []
      };

      const dirName = UriUtils.joinPath(UriUtils.dirname(URI.parse(this.modelState.semanticUri)), '..', 'entities');
      const targetUri = UriUtils.joinPath(dirName, entity.id + '.entity.cm');
      const uri = Utils.findNewUri(targetUri);

      entityRoot.entity = entity;
      const text = this.modelState.semanticSerializer.serialize(entityRoot);

      await this.modelState.modelService.save({ uri: uri.toString(), model: text, clientId: this.modelState.clientId });
      const document = await this.modelState.modelService.request(uri.toString());
      return document?.root?.entity;
   }
}
