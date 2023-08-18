/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { describe, expect, test, beforeAll } from '@jest/globals';

import { Grammar } from 'langium';
import { ExampleGrammarWithIndent } from '../test-utils/example-grammar';
import { TokenType } from 'chevrotain';

import { ExampleGrammarWithNoIndent } from '../test-utils/example-grammar-no-indent';
import { DEDENT, INDENT, NEWLINE, SPACES } from '../../../src/language-server/lexer/cross-model-indentation-tokens';
import { CrossModelTokenBuilder } from '../../../src/language-server/lexer/cross-model-token-generator';

describe('CrossModelTokenBuilder', () => {
    let tokenBuilder: CrossModelTokenBuilder;
    let exampleGrammerWithIndentation: Grammar;
    let exampleGrammerWithNoIndentation: Grammar;

    beforeAll(() => {
        tokenBuilder = new CrossModelTokenBuilder();
        exampleGrammerWithIndentation = ExampleGrammarWithIndent();
        exampleGrammerWithNoIndentation = ExampleGrammarWithNoIndent();
    });

    describe('buildTokens', () => {
        test('Should give NEWLINE token in first spot', () => {
            const tokens = tokenBuilder.buildTokens(exampleGrammerWithIndentation) as TokenType[];

            expect(tokens[0]).toBe(NEWLINE);
        });

        test('Should give DEDENT token in second spot', () => {
            const tokens = tokenBuilder.buildTokens(exampleGrammerWithIndentation) as TokenType[];

            expect(tokens[1]).toBe(DEDENT);
        });

        test('Should give INDENT token in third spot', () => {
            const tokens = tokenBuilder.buildTokens(exampleGrammerWithIndentation) as TokenType[];

            expect(tokens[2]).toBe(INDENT);
        });

        test('Should give SPACE token in last spot', () => {
            const tokens = tokenBuilder.buildTokens(exampleGrammerWithIndentation) as TokenType[];

            const spaceToken = tokens.pop();
            expect(spaceToken).toBe(SPACES);
        });

        test('Should throw error when missing indentation in grammar', () => {
            expect(() => {
                tokenBuilder.buildTokens(exampleGrammerWithNoIndentation) as TokenType[];
            }).toThrow();
        });
    });
});
