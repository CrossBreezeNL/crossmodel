/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
/* eslint-disable no-null/no-null */

import { IToken } from 'chevrotain';
import { IndentationAwareTokenBuilder } from 'langium';
import { CrossModelTerminals } from '../generated/ast.js';

export class CrossModelTokenBuilder extends IndentationAwareTokenBuilder {
   protected readonly listItemRegExp = new RegExp(CrossModelTerminals.LIST_ITEM.source, CrossModelTerminals.LIST_ITEM.flags + 'y');

   /** Flag that indicates whether the token builder will auto-complete the remaining detents at the end of the token stream. */
   autoCompleteDedents = true;

   protected override matchWhitespace(
      text: string,
      offset: number,
      tokens: IToken[],
      groups: Record<string, IToken[]>
   ): { currIndentLevel: number; prevIndentLevel: number; match: RegExpExecArray | null } {
      const match = super.matchWhitespace(text, offset, tokens, groups);
      if (!match.match) {
         return match;
      }
      // list items should be part of the indentation so we try to match them after the general whitespace characters
      // this ensures that the next line must be indented to match the character after the list item marker as is common in YAML.
      this.listItemRegExp.lastIndex = offset + match.currIndentLevel;
      const listItemMatch = this.listItemRegExp.exec(text);
      if (listItemMatch !== null) {
         // we have a list item so we extend the indentation level by the marker
         match.currIndentLevel += listItemMatch[0].length;
      }
      return match;
   }
}
