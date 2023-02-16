/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AstNode, CstNode, findNodeForProperty, isNamed, NameProvider } from 'langium';

export class QualifiedNameProvider implements NameProvider {
   getName(node?: AstNode): string | undefined {
      if (!node) {
         return undefined;
      }
      let name = isNamed(node) ? node.name : undefined;
      let parent = node.$container;
      while (parent && isNamed(parent)) {
         name = concat(parent.name, name);
         parent = parent.$container;
      }
      return name;
   }

   getNameNode(node: AstNode): CstNode | undefined {
      return findNodeForProperty(node.$cstNode, 'name');
   }
}

function concat(...parts: (string | undefined)[]): string | undefined {
   const name = parts.filter(part => !!part && part.length > 0).join('.');
   return name.length === 0 ? undefined : name;
}
