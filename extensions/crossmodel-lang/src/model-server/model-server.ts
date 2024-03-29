/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import {
   CloseModel,
   CloseModelArgs,
   CrossModelRoot,
   FindRootReferenceName,
   FindRootReferenceNameArgs,
   OnSave,
   OnUpdated,
   OpenModel,
   OpenModelArgs,
   RequestModel,
   RequestModelDiagramNode,
   SaveModel,
   SaveModelArgs,
   UpdateModel,
   UpdateModelArgs
} from '@crossbreeze/protocol';
import { URI, isReference } from 'langium';
import { Disposable } from 'vscode-jsonrpc';
import * as rpc from 'vscode-jsonrpc/node.js';
import { CrossModelRoot as CrossModelRootAst, DiagramNode, Entity, isCrossModelRoot } from '../language-server/generated/ast.js';

import { ModelService } from './model-service.js';

/**
 * The model server handles request messages on the RPC connection and ensures that any return value
 * can be sent to the client by ensuring proper serialization of semantic models.
 */
export class ModelServer implements Disposable {
   protected toDispose: Disposable[] = [];
   protected toDisposeForSession: Map<string, Disposable[]> = new Map();

   constructor(
      protected connection: rpc.MessageConnection,
      protected modelService: ModelService
   ) {
      this.initialize(connection);
   }

   protected initialize(connection: rpc.MessageConnection): void {
      this.toDispose.push(connection.onRequest(OpenModel, args => this.openModel(args)));
      this.toDispose.push(connection.onRequest(CloseModel, args => this.closeModel(args)));
      this.toDispose.push(connection.onRequest(RequestModel, uri => this.requestModel(uri)));
      this.toDispose.push(connection.onRequest(RequestModelDiagramNode, (uri, id) => this.requestModelDiagramNode(uri, id)));
      this.toDispose.push(connection.onRequest(FindRootReferenceName, args => this.findReferenceName(args)));
      this.toDispose.push(connection.onRequest(UpdateModel, args => this.updateModel(args)));
      this.toDispose.push(connection.onRequest(SaveModel, args => this.saveModel(args)));
   }

   /**
    * Returns the entity model of the selected node in the diagram.
    *
    * @param uri The uri of the opened diagram
    * @param id The id of the selected node
    * @returns {
    *  uri: of the entity model
    *  entity: model of the entity
    * }
    */
   async requestModelDiagramNode(uri: string, id: string): Promise<DiagramNodeEntity | undefined> {
      const root = (await this.modelService.request(uri)) as CrossModelRootAst;
      let diagramNode: DiagramNode | undefined;

      if (!root || !root.systemDiagram) {
         throw new Error('Something went wrong loading the diagram');
      }

      for (const node of root.systemDiagram.nodes) {
         if (this.modelService.getId(node, URI.parse(uri)) === id) {
            diagramNode = node;
         }
      }

      const entity: Entity | undefined = diagramNode?.entity?.ref;

      if (!entity?.$container.$document) {
         throw new Error('No node found with the given id: ' + id + ' (in ' + uri + ')');
      }

      const serializedEntity = toSerializable({
         $type: 'CrossModelRoot',
         entity: entity
      }) as CrossModelRoot;

      return {
         uri: entity.$container.$document.uri.toString(),
         model: serializedEntity
      };
   }

   protected async findReferenceName(args: FindRootReferenceNameArgs): Promise<string | undefined> {
      return this.modelService.findRootReferenceName(args);
   }

   protected async openModel(args: OpenModelArgs): Promise<CrossModelRoot | undefined> {
      if (!this.modelService.isOpen(args.uri)) {
         await this.modelService.open(args);
      }
      this.setupListeners(args);
      return this.requestModel(args.uri);
   }

   protected setupListeners(args: OpenModelArgs): void {
      this.disposeListeners(args);
      const listenersForClient = [];
      listenersForClient.push(
         this.modelService.onSave(args.uri, event =>
            this.connection.sendNotification(OnSave, {
               uri: args.uri,
               model: toSerializable(event.model) as CrossModelRoot,
               sourceClientId: event.sourceClientId
            })
         ),
         this.modelService.onUpdate(args.uri, event =>
            this.connection.sendNotification(OnUpdated, {
               uri: args.uri,
               model: toSerializable(event.model) as CrossModelRoot,
               sourceClientId: event.sourceClientId,
               reason: event.reason
            })
         )
      );
      this.toDisposeForSession.set(args.clientId, listenersForClient);
   }

   protected disposeListeners(args: CloseModelArgs): void {
      this.toDisposeForSession.get(args.clientId)?.forEach(disposable => disposable.dispose());
      this.toDisposeForSession.delete(args.clientId);
   }

   protected async closeModel(args: CloseModelArgs): Promise<void> {
      this.disposeListeners(args);
      return this.modelService.close(args);
   }

   protected async requestModel(uri: string): Promise<CrossModelRoot | undefined> {
      const root = await this.modelService.request(uri, isCrossModelRoot);
      return toSerializable(root) as CrossModelRoot;
   }

   protected async updateModel(args: UpdateModelArgs<CrossModelRoot>): Promise<CrossModelRoot> {
      const updated = await this.modelService.update(args);
      return toSerializable(updated) as CrossModelRoot;
   }

   protected async saveModel(args: SaveModelArgs<CrossModelRoot>): Promise<void> {
      await this.modelService.save(args);
   }

   dispose(): void {
      this.toDispose.forEach(disposable => disposable.dispose());
   }
}

/**
 * Cleans the semantic object of any property that cannot be serialized as a String and thus cannot be sent to the client
 * over the RPC connection.
 *
 * @param obj semantic object
 * @returns serializable semantic object
 */
export function toSerializable<T extends object>(obj?: T): T | undefined {
   if (!obj) {
      return;
   }
   // We remove all $<property> from the semantic object with the exception of type
   // they are added by Langium but have no additional value on the client side
   // Furthermore we ensure that for references we use their string representation ($refText)
   // instead of their real value to avoid sending whole serialized object graphs
   return <T>Object.entries(obj)
      .filter(([key, value]) => !key.startsWith('$') || key === '$type')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: cleanValue(value) }), {});
}

function cleanValue(value: any): any {
   if (Array.isArray(value)) {
      return value.map(cleanValue);
   } else if (isContainedObject(value)) {
      return toSerializable(value);
   } else {
      return resolvedValue(value);
   }
}

function isContainedObject(value: any): boolean {
   return value === Object(value) && !isReference(value);
}

function resolvedValue(value: any): any {
   if (isReference(value)) {
      return value.$refText;
   }
   return value;
}

interface DiagramNodeEntity {
   uri: string;
   model: CrossModelRoot | undefined;
}
