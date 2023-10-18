/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { describe, expect, test, beforeAll } from '@jest/globals';

import { Grammar } from 'langium';
import { TokenType } from 'chevrotain';

import { DEDENT, INDENT, NEWLINE, SPACES } from '../../../src/language-server/lexer/cross-model-indentation-tokens';
import { CrossModelTokenBuilder } from '../../../src/language-server/lexer/cross-model-token-generator';
import { CrossModelGrammar } from '../../../src/language-server/generated/grammar';
import _ from 'lodash';

describe('CrossModelTokenBuilder', () => {
    let tokenBuilder: CrossModelTokenBuilder;
    let crossModelGrammer: Grammar;
    let crossModelGrammerWithoutIndentation: Grammar;

    beforeAll(() => {
        tokenBuilder = new CrossModelTokenBuilder();
        crossModelGrammer = CrossModelGrammar();
        // CrossModelGrammar loads the grammar in memory instead of making a new grammar
        crossModelGrammerWithoutIndentation = _.cloneDeep(crossModelGrammer);

        crossModelGrammerWithoutIndentation.rules = crossModelGrammerWithoutIndentation.rules.filter(
            rule => ![DEDENT.name, INDENT.name, NEWLINE.name, SPACES.name].includes(rule.name)
        );
    });

    describe('buildTokens', () => {
        test('Should give NEWLINE token in first spot', () => {
            const tokens = tokenBuilder.buildTokens(crossModelGrammer) as TokenType[];

            expect(tokens[0]).toBe(NEWLINE);
        });

        test('Should give DEDENT token in second spot', () => {
            const tokens = tokenBuilder.buildTokens(crossModelGrammer) as TokenType[];

            expect(tokens[1]).toBe(DEDENT);
        });

        test('Should give INDENT token in third spot', () => {
            const tokens = tokenBuilder.buildTokens(crossModelGrammer) as TokenType[];

            expect(tokens[2]).toBe(INDENT);
        });

        test('Should give SPACE token in last spot', () => {
            const tokens = tokenBuilder.buildTokens(crossModelGrammer) as TokenType[];

            const spaceToken = tokens.pop();
            expect(spaceToken).toBe(SPACES);
        });

        test('Should throw error when missing indentation in grammar', () => {
            expect(() => {
                tokenBuilder.buildTokens(crossModelGrammerWithoutIndentation) as TokenType[];
            }).toThrow(new Error('Missing indentation, new line or spaces tokens in grammar'));
        });
    });
});
