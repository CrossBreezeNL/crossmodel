/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AstNode, AstNodeDescription, DefaultScopeComputation, LangiumDocument, PrecomputedScopes, streamAllContents } from 'langium';
import { CancellationToken } from 'vscode-jsonrpc';
import { CrossModelServices } from './cross-model-module';
import { QualifiedNameProvider } from './cross-model-naming';
import { CrossModelPackageManager, UNKNOWN_PROJECT_ID, UNKNOWN_PROJECT_REFERENCE } from './cross-model-package-manager';
import { isCrossModelRoot } from './generated/ast';

export class PackageAstNodeDescription implements AstNodeDescription {
   constructor(
      public packageId: string,
      public name: string,
      public delegate: AstNodeDescription,
      public node = delegate.node,
      public nameSegment = delegate.nameSegment,
      public selectionSegment = delegate.selectionSegment,
      public type = delegate.type,
      public documentUri = delegate.documentUri,
      public path = delegate.path
   ) {}
}

export class PackageLocalAstNodeDescription extends PackageAstNodeDescription {
   constructor(packageName: string, name: string, delegate: AstNodeDescription) {
      super(packageName, name, delegate);
   }
}

export class PackageExternalAstNodeDescription extends PackageAstNodeDescription {
   constructor(packageName: string, name: string, delegate: AstNodeDescription) {
      super(packageName, name, delegate);
   }
}

export class CrossModelScopeComputation extends DefaultScopeComputation {
   protected override nameProvider: QualifiedNameProvider;
   protected packageManager: CrossModelPackageManager;

   constructor(services: CrossModelServices) {
      super(services);
      this.nameProvider = services.references.QualifiedNameProvider;
      this.packageManager = services.shared.workspace.PackageManager;
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

   protected override exportNode(node: AstNode, exports: AstNodeDescription[], document: LangiumDocument<AstNode>): void {
      const packageInfo = this.packageManager.getPackageInfoByDocument(document);
      const packageId = packageInfo?.id ?? UNKNOWN_PROJECT_ID;
      const packageName = packageInfo?.referenceName ?? UNKNOWN_PROJECT_REFERENCE;
      const packageQualifiedName = this.nameProvider.getFullyQualifiedName(node, packageName);

      let description: AstNodeDescription | undefined;
      if (packageQualifiedName) {
         description = this.descriptions.createDescription(node, packageQualifiedName, document);
         exports.push(new PackageExternalAstNodeDescription(packageId, packageQualifiedName, description));
      }
      const packageLocalName = this.nameProvider.getQualifiedName(node);
      if (packageLocalName && description) {
         exports.push(new PackageLocalAstNodeDescription(packageId, packageLocalName, description));
      }
   }

   protected override processNode(node: AstNode, document: LangiumDocument, scopes: PrecomputedScopes): void {
      const container = node.$container;
      if (container) {
         const name = this.nameProvider.getLocalName(node);
         if (name) {
            scopes.add(container, this.descriptions.createDescription(node, name, document));
         }
      }
   }
}
