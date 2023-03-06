/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { DefaultModelState } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { QualifiedNameProvider } from '../../language-server/cross-model-naming';
import { CrossModelRoot, SystemDiagram } from '../../language-server/generated/ast';
import { ModelService } from '../../model-server/model-service';
import { DiagramSerializer } from '../../model-server/serializer';
import { CrossModelLSPServices } from '../integration';
import { CrossModelIndex } from './cross-model-index';

@injectable()
export class CrossModelState extends DefaultModelState {
   @inject(CrossModelIndex) override readonly index: CrossModelIndex;
   @inject(CrossModelLSPServices) readonly services: CrossModelLSPServices;

   protected _semanticUri: string;
   protected _semanticRoot: CrossModelRoot;

   setSemanticRoot(uri: string, semanticRoot: CrossModelRoot): void {
      this._semanticUri = uri;
      this._semanticRoot = semanticRoot;
      this.index.indexSemanticRoot(this.semanticRoot);
   }

   get semanticUri(): string {
      return this._semanticUri;
   }

   get semanticRoot(): CrossModelRoot {
      return this._semanticRoot;
   }

   get diagramRoot(): SystemDiagram {
      return this.semanticRoot.diagram!;
   }

   get modelService(): ModelService {
      return this.services.shared.model.ModelService;
   }

   get semanticSerializer(): DiagramSerializer<CrossModelRoot> {
      return this.services.language.serializer.Serializer;
   }

   get nameProvider(): QualifiedNameProvider {
      return this.services.language.references.QualifiedNameProvider;
   }

   async updateSemanticRoot(content?: string): Promise<void> {
      this._semanticRoot = await this.modelService.update(this.semanticUri, content ?? this.semanticRoot);
      this.index.indexSemanticRoot(this.semanticRoot);
   }

   semanticText(): string {
      return this.services.language.serializer.Serializer.serialize(this.semanticRoot);
   }
}
