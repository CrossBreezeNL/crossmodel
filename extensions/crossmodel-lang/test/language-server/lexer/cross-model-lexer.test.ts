/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { describe, expect, test, beforeAll } from '@jest/globals';
import { EmptyFileSystem } from 'langium';
import { tokenMatcher } from 'chevrotain';

import { CrossModelLexer } from '../../../src/language-server/lexer/cross-model-lexer';
import { DEDENT, INDENT } from '../../../src/language-server/lexer/cross-model-indentation-tokens';
import { createCrossModelServices } from '../../../src/language-server/cross-model-module';

const services = createCrossModelServices({ ...EmptyFileSystem }).CrossModel;

describe('CrossModelLexer', () => {
    let crossModelLexer: CrossModelLexer;

    beforeAll(() => {
        crossModelLexer = new CrossModelLexer(services);
    });

    describe('Simple keywords', () => {
        test('should tokenize a simple word', () => {
            const input = 'entity';

            const lexResult = crossModelLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(1);
            lexResult.tokens.map(token => {
                expect(token.image).toBe('entity');
            });
        });

        test('should tokenize a couple of simple words', () => {
            const input = 'entity entity entity';

            const lexResult = crossModelLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(3);
            lexResult.tokens.map(token => {
                expect(token.image).toBe('entity');
            });
        });
    });

    describe('Indentation', () => {
        test('Simple indentation, should give indent and dedent token', () => {
            const input = '    ';

            const lexResult = crossModelLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(2);

            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);
            expect(tokenMatcher(lexResult.tokens[1], DEDENT)).toBe(true);
        });

        test('single indentation but stay on same level, should give 1 indent and 1 dedent token', () => {
            const input = '    \n    ';

            const lexResult = crossModelLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(2);

            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);
            expect(tokenMatcher(lexResult.tokens[1], DEDENT)).toBe(true);
        });

        test('double indentation, should give indent and dedent token', () => {
            const input = '    \n      ';

            const lexResult = crossModelLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(4);

            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);
            expect(tokenMatcher(lexResult.tokens[1], INDENT)).toBe(true);
            expect(tokenMatcher(lexResult.tokens[2], DEDENT)).toBe(true);
            expect(tokenMatcher(lexResult.tokens[3], DEDENT)).toBe(true);
        });

        test('double indentation, but dedent in text', () => {
            const input = '    \n      \n    ';

            const lexResult = crossModelLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(4);

            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);
            expect(tokenMatcher(lexResult.tokens[1], INDENT)).toBe(true);
            expect(tokenMatcher(lexResult.tokens[2], DEDENT)).toBe(true);
            expect(tokenMatcher(lexResult.tokens[3], DEDENT)).toBe(true);
        });
    });
});
