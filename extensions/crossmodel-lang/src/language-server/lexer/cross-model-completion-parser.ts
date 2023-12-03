/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { LangiumCompletionParser, LangiumServices, createCompletionParser } from 'langium';
import { CrossModelLexer } from './cross-model-lexer.js';

export function createCrossModelCompletionParser(services: LangiumServices): LangiumCompletionParser {
   const parser = createCompletionParser(services);
   const originalParse = parser.parse.bind(parser);
   const lexer = parser['lexer'] as CrossModelLexer;
   parser.parse = input => {
      // turn off auto-completion in the lexer, i.e., generation of dedents, as it messes with the auto-completion
      lexer.autoCompleteDedents = false;
      try {
         return originalParse(input);
      } finally {
         lexer.autoCompleteDedents = true;
      }
   };
   return parser;
}
