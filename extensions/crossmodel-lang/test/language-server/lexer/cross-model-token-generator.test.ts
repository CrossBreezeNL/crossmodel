/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { beforeAll, describe, expect, test } from '@jest/globals';

import { TokenType } from 'chevrotain';
import { Grammar } from 'langium';

import _ from 'lodash';
import { CrossModelGrammar } from '../../../src/language-server/generated/grammar.js';
import { DEDENT, INDENT, NEWLINE, SPACES } from '../../../src/language-server/lexer/cross-model-indentation-tokens.js';
import { CrossModelTokenBuilder } from '../../../src/language-server/lexer/cross-model-token-generator.js';

describe('CrossModelTokenBuilder', () => {
   let tokenBuilder: CrossModelTokenBuilder;
   let crossModelGrammar: Grammar;
   let crossModelGrammarWithoutIndentation: Grammar;

   beforeAll(() => {
      tokenBuilder = new CrossModelTokenBuilder();
      crossModelGrammar = CrossModelGrammar();
      // CrossModelGrammar loads the grammar in memory instead of making a new grammar
      crossModelGrammarWithoutIndentation = _.cloneDeep(crossModelGrammar);

      crossModelGrammarWithoutIndentation.rules = crossModelGrammarWithoutIndentation.rules.filter(
         rule => ![DEDENT.name, INDENT.name, NEWLINE.name, SPACES.name].includes(rule.name)
      );
   });

   describe('buildTokens', () => {
      test('Should give NEWLINE token in first spot', () => {
         const tokens = tokenBuilder.buildTokens(crossModelGrammar) as TokenType[];

         expect(tokens[0]).toBe(NEWLINE);
      });

      test('Should give DEDENT token in second spot', () => {
         const tokens = tokenBuilder.buildTokens(crossModelGrammar) as TokenType[];

         expect(tokens[1]).toBe(DEDENT);
      });

      test('Should give INDENT token in third spot', () => {
         const tokens = tokenBuilder.buildTokens(crossModelGrammar) as TokenType[];

         expect(tokens[2]).toBe(INDENT);
      });

      test('Should give SPACE token in last spot', () => {
         const tokens = tokenBuilder.buildTokens(crossModelGrammar) as TokenType[];

         const spaceToken = tokens.pop();
         expect(spaceToken).toBe(SPACES);
      });

      test('Should throw error when missing indentation in grammar', () => {
         expect(() => {
            tokenBuilder.buildTokens(crossModelGrammarWithoutIndentation) as TokenType[];
         }).toThrow(new Error('Missing indentation, new line or spaces tokens in grammar'));
      });
   });
});
