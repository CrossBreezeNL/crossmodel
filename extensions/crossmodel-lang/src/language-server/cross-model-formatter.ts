/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AbstractFormatter, AstNode, Formatting } from 'langium';
import * as ast from './generated/ast';

export class CrossModelModelFormatter extends AbstractFormatter {
   protected format(node: AstNode): void {
      if (ast.isEntity(node)) {
         const formatter = this.getNodeFormatter(node);
         const bracesOpen = formatter.keyword('{');
         const bracesClose = formatter.keyword('}');
         formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
         bracesClose.prepend(Formatting.newLine());
      } else if (ast.isRelationship(node)) {
         const formatter = this.getNodeFormatter(node);
         const nodes = formatter.nodes(...node.properties);
         nodes.prepend(Formatting.noIndent());
      } else if (ast.isAttribute(node)) {
         const formatter = this.getNodeFormatter(node);
         const bracesOpen = formatter.keyword('{');
         const bracesClose = formatter.keyword('}');
         formatter.interior(bracesOpen, bracesClose).prepend(Formatting.indent());
         bracesClose.prepend(Formatting.newLine());
      }
   }
}
