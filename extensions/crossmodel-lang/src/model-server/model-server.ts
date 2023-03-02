/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AstNode } from 'langium';
import { Disposable } from 'vscode-jsonrpc';
import * as rpc from 'vscode-jsonrpc/node';
import { ModelService } from './model-service';

const OpenModel = new rpc.RequestType1<string, void, void>('server/open');
const CloseModel = new rpc.RequestType1<string, void, void>('server/close');
const RequestModel = new rpc.RequestType1<string, AstNode | undefined, void>('server/request');
const UpdateModel = new rpc.RequestType2<string, AstNode, void, void>('server/update');
const SaveModel = new rpc.RequestType2<string, AstNode, void, void>('server/save');

export class ModelServer implements Disposable {
   protected toDispose: Disposable[] = [];

   constructor(protected connection: rpc.MessageConnection, protected modelService: ModelService) {
      this.initialize(connection);
   }

   protected initialize(connection: rpc.MessageConnection): void {
      this.toDispose.push(connection.onRequest(OpenModel, uri => this.modelService.open(uri)));
      this.toDispose.push(connection.onRequest(CloseModel, uri => this.modelService.close(uri)));
      this.toDispose.push(connection.onRequest(RequestModel, uri => this.modelService.request(uri)));
      this.toDispose.push(connection.onRequest(UpdateModel, (uri, model) => this.modelService.update(uri, model)));
      this.toDispose.push(connection.onRequest(SaveModel, (uri, model) => this.modelService.save(uri, model)));
   }

   dispose(): void {
      this.toDispose.forEach(disposable => disposable.dispose());
   }
}
