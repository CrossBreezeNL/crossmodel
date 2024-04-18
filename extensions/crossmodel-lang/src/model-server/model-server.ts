/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import {
   CloseModel,
   CloseModelArgs,
   CrossModelRoot,
   CrossReference,
   CrossReferenceContext,
   FindReferenceableElements,
   OnSave,
   OnUpdated,
   OpenModel,
   OpenModelArgs,
   ReferenceableElement,
   RequestModel,
   ResolveReference,
   ResolvedElement,
   SaveModel,
   SaveModelArgs,
   UpdateModel,
   UpdateModelArgs
} from '@crossbreeze/protocol';
import { AstNode, findRootNode, getDocument, isReference } from 'langium';
import { Disposable } from 'vscode-jsonrpc';
import * as rpc from 'vscode-jsonrpc/node.js';
import { isCrossModelRoot } from '../language-server/generated/ast.js';

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
      this.toDispose.push(connection.onRequest(FindReferenceableElements, args => this.complete(args)));
      this.toDispose.push(connection.onRequest(ResolveReference, args => this.resolve(args)));
      this.toDispose.push(connection.onRequest(UpdateModel, args => this.updateModel(args)));
      this.toDispose.push(connection.onRequest(SaveModel, args => this.saveModel(args)));
   }

   protected complete(args: CrossReferenceContext): Promise<ReferenceableElement[]> {
      return this.modelService.findReferenceableElements(args);
   }

   protected async resolve(args: CrossReference): Promise<ResolvedElement | undefined> {
      const node = await this.modelService.resolveCrossReference(args);
      if (!node) {
         return undefined;
      }
      const uri = getDocument(node).uri.toString();
      const model = this.toSerializable(findRootNode(node)) as CrossModelRoot;
      return { uri, model };
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
               model: this.toSerializable(event.model) as CrossModelRoot,
               sourceClientId: event.sourceClientId
            })
         ),
         this.modelService.onUpdate(args.uri, event =>
            this.connection.sendNotification(OnUpdated, {
               uri: args.uri,
               model: this.toSerializable(event.model) as CrossModelRoot,
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
      return this.toSerializable(root) as CrossModelRoot;
   }

   protected async updateModel(args: UpdateModelArgs<CrossModelRoot>): Promise<CrossModelRoot> {
      const updated = await this.modelService.update(args);
      return this.toSerializable(updated) as CrossModelRoot;
   }

   protected async saveModel(args: SaveModelArgs<CrossModelRoot>): Promise<void> {
      await this.modelService.save(args);
   }

   dispose(): void {
      this.toDispose.forEach(disposable => disposable.dispose());
   }

   /**
    * Cleans the semantic object of any property that cannot be serialized as a String and thus cannot be sent to the client
    * over the RPC connection.
    *
    * @param obj semantic object
    * @returns serializable semantic object
    */
   protected toSerializable<T extends AstNode, O extends object>(obj?: T): O | undefined {
      if (!obj) {
         return;
      }
      // We remove all $<property> from the semantic object with the exception of type
      // they are added by Langium but have no additional value on the client side
      // Furthermore we ensure that for references we use their string representation ($refText)
      // instead of their real value to avoid sending whole serialized object graphs
      return <O>Object.entries(obj)
         .filter(([key, value]) => !key.startsWith('$') || key === '$type')
         .reduce((acc, [key, value]) => ({ ...acc, [key]: this.cleanValue(value) }), { $globalId: this.modelService.getGlobalId(obj) });
   }

   protected cleanValue(value: any): any {
      if (Array.isArray(value)) {
         return value.map(val => this.cleanValue(val));
      } else if (this.isContainedObject(value)) {
         return this.toSerializable(value);
      } else {
         return this.resolvedValue(value);
      }
   }

   protected isContainedObject(value: any): boolean {
      return value === Object(value) && !isReference(value);
   }

   protected resolvedValue(value: any): any {
      if (isReference(value)) {
         return value.$refText;
      }
      return value;
   }
}
