/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { DefaultModelState } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { LangiumDocument } from 'langium';
import { CrossModelRoot, SystemDiagram } from '../../language-server/generated/ast';
import { CrossModelLSPServices } from '../integration';
import { CrossModelIndex } from './cross-model-index';

@injectable()
export class CrossModelState extends DefaultModelState {
   @inject(CrossModelIndex) override readonly index: CrossModelIndex;
   @inject(CrossModelLSPServices) readonly services: CrossModelLSPServices;

   protected _document: LangiumDocument<CrossModelRoot>;

   get document(): LangiumDocument<CrossModelRoot> {
      return this._document;
   }

   set document(document: LangiumDocument<CrossModelRoot>) {
      this._document = document;
      this.index.indexSemanticRoot(this.semanticRoot);
   }

   get semanticRoot(): CrossModelRoot {
      return this.document.parseResult.value;
   }

   get diagramRoot(): SystemDiagram {
      return this.semanticRoot.diagram!;
   }

   get id(): string {
      return this.document.uri.fsPath;
   }
}
