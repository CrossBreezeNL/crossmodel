/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AstNode, AstNodeDescription, DefaultScopeComputation, LangiumDocument, PrecomputedScopes, streamAllContents } from 'langium';
import { CancellationToken } from 'vscode-jsonrpc';
import { CrossModelServices } from './cross-model-module.js';
import { DefaultIdProvider, combineIds } from './cross-model-naming.js';
import { CrossModelPackageManager, UNKNOWN_PROJECT_ID, UNKNOWN_PROJECT_REFERENCE } from './cross-model-package-manager.js';
import {
   EntityNode,
   EntityNodeAttribute,
   SourceObject,
   SourceObjectAttribute,
   TargetObject,
   TargetObjectAttribute,
   isEntityNode,
   isSourceObject,
   isTargetObject
} from './generated/ast.js';
import { findDocument, setAttributes, setImplicitId, setOwner } from './util/ast-util.js';

/**
 * Custom node description that wraps a given description under a potentially new name and also stores the package id for faster access.
 */
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

/**
 * Custom class to represent package-local descriptions without the package name so we can do easier instanceof checks.
 */
export class PackageLocalAstNodeDescription extends PackageAstNodeDescription {
   constructor(packageName: string, name: string, delegate: AstNodeDescription) {
      super(packageName, name, delegate);
   }
}

/**
 * Custom class to represent package-external descriptions with the package name so we can do easier instanceof checks.
 */
export class GlobalAstNodeDescription extends PackageAstNodeDescription {
   constructor(packageName: string, name: string, delegate: AstNodeDescription) {
      super(packageName, name, delegate);
   }
}

export function isGlobalDescriptionForLocalPackage(description: AstNodeDescription, packageId?: string): boolean {
   return packageId !== undefined && description instanceof GlobalAstNodeDescription && description.packageId === packageId;
}

export function getLocalName(description: AstNodeDescription): string {
   return description instanceof GlobalAstNodeDescription ? getLocalName(description.delegate) ?? description.name : description.name;
}

/**
 * A scope computer that performs the following customizations:
 * - Avoid exporting any nodes from diagrams, they are self-contained and do not need to be externally accessible.
 * - Store the package id for each node so we can do faster dependency calculation.
 * - Export nodes twice: Once for external usage with the fully-qualified name and once for package-local usage.
 */
export class CrossModelScopeComputation extends DefaultScopeComputation {
   protected idProvider: DefaultIdProvider;
   protected packageManager: CrossModelPackageManager;

   constructor(services: CrossModelServices) {
      super(services);
      this.idProvider = services.references.IdProvider;
      this.packageManager = services.shared.workspace.PackageManager;
   }

   // overridden because we use 'streamAllContents' as children retrieval instead of 'streamContents'
   override async computeExportsForNode(
      parentNode: AstNode,
      document: LangiumDocument<AstNode>,
      children: (root: AstNode) => Iterable<AstNode> = streamAllContents,
      cancelToken: CancellationToken = CancellationToken.None
   ): Promise<AstNodeDescription[]> {
      return super.computeExportsForNode(parentNode, document, children, cancelToken);
   }

   protected override exportNode(node: AstNode, exports: AstNodeDescription[], document: LangiumDocument<AstNode>): void {
      const packageInfo = this.packageManager.getPackageInfoByDocument(document);
      const packageId = packageInfo?.id ?? UNKNOWN_PROJECT_ID;
      const packageName = packageInfo?.referenceName ?? UNKNOWN_PROJECT_REFERENCE;

      // Export nodes twice: Once for external usage with the fully-qualified name and once for package-local usage.
      // To avoid duplicates in the UI but still allow access to the node through both names we filter the
      // external usage descriptions in the CrossModelCompletionProvider if package-local usage is also available

      let description: AstNodeDescription | undefined;
      const localId = this.idProvider.getLocalId(node);
      if (localId) {
         description = this.descriptions.createDescription(node, localId, document);
         exports.push(new PackageLocalAstNodeDescription(packageId, localId, description));
      }

      const globalId = this.idProvider.getGlobalId(node, packageName);
      if (globalId && description) {
         exports.push(new GlobalAstNodeDescription(packageId, globalId, description));
      }
   }

   protected override processNode(node: AstNode, document: LangiumDocument, scopes: PrecomputedScopes): void {
      const container = node.$container;
      if (container) {
         const id = this.idProvider.getNodeId(node);
         if (id) {
            scopes.add(container, this.descriptions.createDescription(node, id, document));
            if (isEntityNode(node)) {
               this.processEntityNode(node, id, document).forEach(description => scopes.add(container, description));
            } else if (isSourceObject(node)) {
               this.processSourceObject(node, id, document).forEach(description => scopes.add(container, description));
            }
         }
         if (isTargetObject(node) && node.entity?.ref?.id) {
            this.processTargetObject(node, node.entity?.ref.id, document).forEach(description => scopes.add(container, description));
         }
      }
   }

   protected processEntityNode(node: EntityNode, nodeId: string, document: LangiumDocument): AstNodeDescription[] {
      try {
         // TODO: Check if this is still necessary
         if (node.entity?.ref) {
            findDocument(node.entity.ref);
         }
      } catch (error) {
         console.error(error);
         return [];
      }
      const attributes =
         node.entity?.ref?.attributes.map<EntityNodeAttribute>(attribute => setOwner({ ...attribute, $type: EntityNodeAttribute }, node)) ??
         [];
      setAttributes(node, attributes);
      return attributes.map(attribute => this.descriptions.createDescription(attribute, combineIds(nodeId, attribute.id), document));
   }

   protected processSourceObject(node: SourceObject, nodeId: string, document: LangiumDocument): AstNodeDescription[] {
      const attributes =
         node.entity?.ref?.attributes.map<SourceObjectAttribute>(attribute =>
            setOwner({ ...attribute, $type: SourceObjectAttribute }, node)
         ) ?? [];
      setAttributes(node, attributes);
      return attributes.map(attribute => this.descriptions.createDescription(attribute, combineIds(nodeId, attribute.id), document));
   }

   protected processTargetObject(node: TargetObject, nodeId: string, document: LangiumDocument): AstNodeDescription[] {
      const attributes =
         node.entity?.ref?.attributes.map<TargetObjectAttribute>(attribute =>
            setOwner({ ...attribute, $type: TargetObjectAttribute }, node)
         ) ?? [];
      setImplicitId(node, nodeId);
      setAttributes(node, attributes);
      // for target attributes, we use simple names and not object-qualified ones
      return attributes.map(attribute => this.descriptions.createDescription(attribute, attribute.id, document));
   }
}
