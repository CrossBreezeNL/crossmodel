/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CloseModel, CrossModelRoot, OpenModel, RequestModel, SaveModel, UpdateModel } from '@crossbreeze/protocol';
import { AstNode, isReference } from 'langium';
import { Disposable } from 'vscode-jsonrpc';
import * as rpc from 'vscode-jsonrpc/node';
import { isCrossModelRoot } from '../language-server/generated/ast';
import { ModelService } from './model-service';

/**
 * The model server handles request messages on the RPC connection and ensures that any return value
 * can be sent to the client by ensuring proper serialization of semantic models.
 */
export class ModelServer implements Disposable {
   protected toDispose: Disposable[] = [];

   constructor(protected connection: rpc.MessageConnection, protected modelService: ModelService) {
      this.initialize(connection);
   }

   protected initialize(connection: rpc.MessageConnection): void {
      this.toDispose.push(connection.onRequest(OpenModel, uri => this.openModel(uri)));
      this.toDispose.push(connection.onRequest(CloseModel, uri => this.closeModel(uri)));
      this.toDispose.push(connection.onRequest(RequestModel, uri => this.requestModel(uri)));
      this.toDispose.push(connection.onRequest(UpdateModel, (uri, model) => this.updateModel(uri, model)));
      this.toDispose.push(connection.onRequest(SaveModel, (uri, model) => this.saveModel(uri, model)));
   }

   protected async openModel(uri: string): Promise<void> {
      await this.modelService.open(uri);
   }

   protected async closeModel(uri: string): Promise<void> {
      await this.modelService.close(uri);
   }

   protected async requestModel(uri: string): Promise<CrossModelRoot | undefined> {
      const root = await this.modelService.request(uri, isCrossModelRoot);
      return toSerializable(root) as CrossModelRoot;
   }

   protected async updateModel(uri: string, model: AstNode): Promise<void> {
      await this.modelService.update(uri, model);
   }

   protected async saveModel(uri: string, model: AstNode): Promise<void> {
      await this.modelService.save(uri, model);
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
   // Furtermore we ensure that for references we use their string representation ($refText)
   // instead of their real value to avoid sending whole serialized object graphs
   return <T>Object.entries(obj)
      .filter(([key, value]) => !key.startsWith('$') || key === '$type')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: cleanValue(value) }), {});
}

function cleanValue(value: any): any {
   return isContainedObject(value) ? toSerializable(value) : resolvedValue(value);
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
