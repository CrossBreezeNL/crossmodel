/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AstNode, CstNode, findNodeForProperty, isAstNode, NameProvider, streamAst } from 'langium';
import { CrossModelServices } from './cross-model-module.js';
import { UNKNOWN_PROJECT_REFERENCE } from './cross-model-package-manager.js';
import { findDocument, getOwner } from './util/ast-util.js';

export const ID_PROPERTY = 'id';

export type IdentifiableAstNode = AstNode & {
   id?: string;
};

export type IdentifiedAstNode = AstNode & {
   [ID_PROPERTY]: string;
};

export function hasId(node?: AstNode): node is IdentifiedAstNode {
   return !!node && ID_PROPERTY in node && typeof node[ID_PROPERTY] === 'string';
}

export function getId(node?: AstNode): string | undefined {
   return hasId(node) ? node[ID_PROPERTY] : undefined;
}

export interface IdProvider extends NameProvider {
   getNodeId(node?: AstNode): string | undefined;
   getLocalId(node?: AstNode): string | undefined;
   getExternalId(node?: AstNode): string | undefined;

   findNextId(type: string, proposal: string | undefined): string;
   findNextId(type: string, proposal: string | undefined, container: AstNode): string;
}

export const QUALIFIED_ID_SEPARATOR = '.';

export function combineIds(...ids: string[]): string {
   return ids.join(QUALIFIED_ID_SEPARATOR);
}

/**
 * A name provider that returns the fully qualified ID of a node by default but also exposes methods to get other names:
 * - The Node ID is just the id of the node itself if it has an id.
 * - The Local ID is the Node ID itself plus the Node ID of all it's parents within the same document.
 * - The External ID is the Local ID prefixed with the package name.
 */
export class DefaultIdProvider implements NameProvider, IdProvider {
   constructor(
      protected services: CrossModelServices,
      protected packageManager = services.shared.workspace.PackageManager
   ) {}

   /**
    * Returns the direct name of the node if it has one.
    *
    * @param node node
    * @returns direct, local name of the node if available
    */
   getNodeId(node?: AstNode): string | undefined {
      return getId(node);
   }

   /**
    * Returns the qualified name / document-local name, i.e., the local name of the node plus the local name of all it's named
    * parents within the document.
    *
    * @param node node
    * @returns qualified, document-local name
    */
   getLocalId(node?: AstNode): string | undefined {
      if (!node) {
         return undefined;
      }
      let id = this.getNodeId(node);
      if (!id) {
         return undefined;
      }
      let parent = this.getParent(node);
      while (parent) {
         const parentId = this.getNodeId(parent);
         if (parentId) {
            id = combineIds(parentId, id);
         }
         parent = this.getParent(parent);
      }
      return id;
   }

   /**
    * Returns the fully-qualified / package-local name, i.e., the package name plus the document-local name.
    *
    * @param node node
    * @param packageName package name
    * @returns fully qualified, package-local name
    */
   getExternalId(node?: AstNode, packageName = this.getPackageName(node)): string | undefined {
      const localId = this.getLocalId(node);
      if (!localId) {
         return undefined;
      }
      return combineIds(packageName, localId);
   }

   getPackageName(node?: AstNode): string {
      return !node
         ? UNKNOWN_PROJECT_REFERENCE
         : this.packageManager.getPackageInfoByDocument(findDocument(node))?.referenceName ?? UNKNOWN_PROJECT_REFERENCE;
   }

   getName(node?: AstNode): string | undefined {
      return node ? this.getExternalId(node) : undefined;
   }

   getNameNode(node: AstNode): CstNode | undefined {
      return findNodeForProperty(node.$cstNode, ID_PROPERTY);
   }

   findNextId(type: string, proposal: string | undefined): string;
   findNextId(type: string, proposal: string | undefined, container: AstNode): string;
   findNextId(type: string, proposal: string | undefined, container?: AstNode): string {
      if (isAstNode(container)) {
         return this.findNextIdInContainer(type, proposal ?? 'Element', container);
      }
      return this.findNextIdInIndex(type, proposal ?? 'Element');
   }

   protected getParent(node: AstNode): AstNode | undefined {
      return getOwner(node) ?? node.$container;
   }

   protected findNextIdInContainer(type: string, proposal: string, container: AstNode): string {
      const knownIds = streamAst(container)
         .filter(node => node.$type === type)
         .map(this.getNodeId)
         .nonNullable()
         .toArray();
      return this.countToNextId(knownIds, proposal);
   }

   protected findNextIdInIndex(type: string, proposal: string): string {
      const knownIds = this.services.shared.workspace.IndexManager.allElements(type)
         .map(element => element.name)
         .toArray();
      return this.countToNextId(knownIds, proposal);
   }

   protected countToNextId(knownIds: string[], proposal: string): string {
      let nextId = proposal;
      let counter = 1;
      while (knownIds.includes(nextId)) {
         nextId = proposal + counter++;
      }
      return nextId;
   }
}
