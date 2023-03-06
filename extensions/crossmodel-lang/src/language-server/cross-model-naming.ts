/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AstNode, CstNode, findNodeForProperty, getDocument, isNamed, NameProvider } from 'langium';
import { CrossModelServices } from './cross-model-module';
import { UNKNOWN_PROJECT_REFERENCE } from './cross-model-package-manager';

export class QualifiedNameProvider implements NameProvider {
   constructor(protected services: CrossModelServices, protected packageManager = services.shared.workspace.PackageManager) {}

   getLocalName(node?: AstNode): string | undefined {
      return node && isNamed(node) ? node.name : undefined;
   }

   getQualifiedName(node?: AstNode): string | undefined {
      if (!node) {
         return undefined;
      }
      let name = this.getLocalName(node);
      let parent = node.$container;
      while (parent && isNamed(parent)) {
         name = concat(parent.name, name);
         parent = parent.$container;
      }
      return name;
   }

   getFullyQualifiedName(
      node: AstNode,
      packageName = this.packageManager.getPackageInfoByDocument(getDocument(node))?.referenceName ?? UNKNOWN_PROJECT_REFERENCE
   ): string | undefined {
      const packageLocalName = this.getQualifiedName(node);
      return packageName + '/' + packageLocalName;
   }

   getName(node?: AstNode): string | undefined {
      return node ? this.getFullyQualifiedName(node) : undefined;
   }

   getNameNode(node: AstNode): CstNode | undefined {
      return findNodeForProperty(node.$cstNode, 'name');
   }
}

function concat(...parts: (string | undefined)[]): string | undefined {
   const name = parts.filter(part => !!part && part.length > 0).join('.');
   return name.length === 0 ? undefined : name;
}
