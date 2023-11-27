/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { createTokenInstance } from 'chevrotain';
import { DefaultLexer, LexerResult } from 'langium';
import { indentStack } from './cross-model-indent-stack.js';
import { DEDENT, NAMES } from './cross-model-indentation-tokens.js';
import { IndentationError } from './cross-model-lexer-error.js';

/**
 * Custom CrossModelLexer to get indentation working.
 */
export class CrossModelLexer extends DefaultLexer {
   /**
    * Tokenize the given text. custom implementation to get indentation working.
    *
    * @param text The text to tokenize
    * @returns LexerResult, The result of the lexing
    */
   override tokenize(text: string): LexerResult {
      indentStack.reset();
      let chevrotainResult;

      // In case there is a error lexing, Most of the time this is a lexer error but can
      try {
         chevrotainResult = super.tokenize(text);
      } catch (error) {
         const returnResult: LexerResult = {
            tokens: [],
            hidden: [],
            errors: []
         };

         if (error instanceof IndentationError) {
            returnResult.errors.push({
               message: 'Indentation error: Make sure the indentation is correct in the file',
               offset: 0,
               line: 1,
               column: 1,
               length: 1
            });
         } else {
            returnResult.errors.push({
               message: 'Unknown error Lexer error',
               offset: 0,
               line: 1,
               column: 1,
               length: 1
            });

            throw error;
         }

         return returnResult;
      }

      // The lexer does not add trailing dedents at the end of the file
      // this method does it for us
      this.createTrailingDedentTokens(text, chevrotainResult);

      return chevrotainResult;
   }

   /**
    * Add dedents tokens at the end of the tokenlist.
    *
    * @param text The text that was tokenized
    * @param lexingResult The token results of the text
    */
   private createTrailingDedentTokens(text: string, lexingResult: LexerResult): void {
      // These are there to put the error warning in the right place in the editor
      const lines = text.split(/\r\n|\r|\n/);
      const lastLine = lines[lines.length - 1];

      // add remaining dedents
      while (indentStack.pop()) {
         // chevrotain uses 1-based indices for tokens which Langium transforms into 0-based indices by deducting 1
         // see for instance https://github.com/eclipse-langium/langium/blob/eea5bc2/packages/langium/src/utils/cst-util.ts#L49
         const startOffset = text.length || 1;
         const endOffset = text.length || 1;
         const startLine = lines.length || 1;
         const endLine = lines.length || 1;
         const startColumn = lastLine?.length || 0 + 1;
         const endColumn = lastLine?.length || 0; // for some reason end-column uses the correct index
         const lineToken = createTokenInstance(DEDENT, NAMES.DEDENT, startOffset, endOffset, startLine, endLine, startColumn, endColumn);
         lexingResult.tokens.push(lineToken);
      }
   }
}
