/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import {
   AstNode,
   AstNodeDescription,
   DefaultNameProvider,
   DefaultScopeComputation,
   LangiumDocument,
   PrecomputedScopes,
   streamAllContents
} from 'langium';
import { CancellationToken } from 'vscode-jsonrpc';
import { CrossModelServices } from './cross-model-module';
import { QualifiedNameProvider } from './cross-model-naming';
import { isCrossModelRoot } from './generated/ast';

export class CrossModelScopeComputation extends DefaultScopeComputation {
   protected override nameProvider: QualifiedNameProvider;

   constructor(services: CrossModelServices) {
      super(services);
      this.nameProvider = services.references.QualifiedNameProvider;
   }

   // overridden because we use 'streamAllContents' as children retrieval instead of 'streamContents'
   override async computeExportsForNode(
      parentNode: AstNode,
      document: LangiumDocument<AstNode>,
      children: (root: AstNode) => Iterable<AstNode> = streamAllContents,
      cancelToken: CancellationToken = CancellationToken.None
   ): Promise<AstNodeDescription[]> {
      const docRoot = document.parseResult.value;
      if (isCrossModelRoot(docRoot) && docRoot.diagram) {
         // we do not export anything from diagrams, they are self-contained
         return [];
      }
      return super.computeExportsForNode(parentNode, document, children, cancelToken);
   }

   override async computeLocalScopes(
      document: LangiumDocument<AstNode>,
      cancelToken?: CancellationToken | undefined
   ): Promise<PrecomputedScopes> {
      // use local scope to provide secondary access to globally available objects using a local name only
      const qualifiedNameProvider = this.nameProvider;
      try {
         this.nameProvider = new DefaultNameProvider();
         const result = await super.computeLocalScopes(document, cancelToken);
         return result;
      } finally {
         this.nameProvider = qualifiedNameProvider;
      }
   }
}
