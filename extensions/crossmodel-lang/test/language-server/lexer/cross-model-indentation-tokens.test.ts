/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { describe, expect, test, beforeEach, beforeAll, jest } from '@jest/globals';
import { Lexer, TokenType, createToken, tokenMatcher } from 'chevrotain';

import { SPACES, NEWLINE, INDENT, DEDENT } from '../../../src/language-server/lexer/cross-model-indentation-tokens.js';
import { indentStack } from '../../../src/language-server/lexer/cross-model-indent-stack.js';

jest.useFakeTimers();

describe('matchIndentBase', () => {
    let TESTTOKEN: TokenType;
    let LINETOKEN: TokenType;
    let testLexer: Lexer;

    beforeAll(() => {
        TESTTOKEN = createToken({
            name: 'TESTTOKEN',
            pattern: /TESTTOKEN/
        });

        LINETOKEN = createToken({
            name: 'LINETOKEN',
            pattern: /-/
        });

        testLexer = new Lexer([NEWLINE, DEDENT, INDENT, LINETOKEN, TESTTOKEN, SPACES]);
    });

    beforeEach(() => {
        indentStack.reset();
    });

    describe('SPACES token', () => {
        test('should not produce a token for spaces between words', () => {
            const input = 'TESTTOKEN TESTTOKEN';

            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(2);
            lexResult.tokens.map(token => {
                expect(tokenMatcher(token, TESTTOKEN)).toBe(true);
            });
        });

        test('should not produce a token for spaces at the end of a line', () => {
            const input = 'TESTTOKEN    ';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(1);
            lexResult.tokens.map(token => {
                expect(tokenMatcher(token, TESTTOKEN)).toBe(true);
            });
        });
    });

    describe('NEWLINE token', () => {
        test('should match a newline character', () => {
            const input = '\n';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(0);
            expect(lexResult.groups).toHaveProperty('nl');
            expect(lexResult.groups.nl).toHaveLength(1);
            expect(tokenMatcher(lexResult.groups.nl[0], NEWLINE)).toBe(true);
        });

        test('should match a newline character with carriage return', () => {
            const input = '\r\n';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(0);
            expect(lexResult.groups).toHaveProperty('nl');
            expect(lexResult.groups.nl).toHaveLength(1);
            expect(tokenMatcher(lexResult.groups.nl[0], NEWLINE)).toBe(true);
        });

        test('should match a newline in the middle of a line', () => {
            const input = 'TESTTOKEN\nTESTTOKEN';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(2);
            expect(tokenMatcher(lexResult.tokens[0], TESTTOKEN)).toBe(true);
            expect(tokenMatcher(lexResult.tokens[1], TESTTOKEN)).toBe(true);

            expect(lexResult.groups).toHaveProperty('nl');
            expect(lexResult.groups.nl).toHaveLength(1);
            expect(tokenMatcher(lexResult.groups.nl[0], NEWLINE)).toBe(true);
        });

        test('should match a newline preceded by spaces', () => {
            const input = '    \n';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.groups).toHaveProperty('nl');
            expect(lexResult.groups.nl).toHaveLength(1);
            expect(tokenMatcher(lexResult.groups.nl[0], NEWLINE)).toBe(true);
            expect(lexResult.groups.nl[0].image).toBe('\n');
        });

        test('should match a newline followed by spaces', () => {
            const input = '\n    ';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.groups).toHaveProperty('nl');
            expect(lexResult.groups.nl).toHaveLength(1);
            expect(tokenMatcher(lexResult.groups.nl[0], NEWLINE)).toBe(true);
            expect(lexResult.groups.nl[0].image).toBe('\n');
        });
    });

    describe('INDENT token', () => {
        test('should match indentation at the start of a line', () => {
            const input = '    ';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(1);
            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);
            expect(lexResult.tokens[0].image).toBe(input);
            expect(indentStack.getLast()).toBe(4);
        });

        test('should match indentation at the start of a line, when there are other token after it', () => {
            const input = '    TESTTOKEN';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(2);
            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);
            expect(tokenMatcher(lexResult.tokens[1], TESTTOKEN)).toBe(true);
            expect(lexResult.tokens[0].image).toBe('    ');
            // Check what the current indentation is
            expect(indentStack.getLast()).toBe(4);
        });

        test('should match indentation at the start of a line', () => {
            const input = 'TESTTOKEN\n    ';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(2);
            expect(tokenMatcher(lexResult.tokens[0], TESTTOKEN)).toBe(true);
            expect(tokenMatcher(lexResult.tokens[1], INDENT)).toBe(true);
            expect(lexResult.tokens[1].image).toBe('    ');
            // Check what the current indentation is
            expect(indentStack.getLast()).toBe(4);
        });

        test('should match indentation when only new lines preceding', () => {
            const input = '\n\n\n\n    ';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(1);
            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);
            expect(lexResult.tokens[0].image).toBe('    ');
            expect(indentStack.getLast()).toBe(4);
            expect(lexResult.groups.nl).toHaveLength(4);
        });

        test('Should only match follow up indentation', () => {
            const input = '    \n      ';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(2);
            expect(lexResult.groups.nl).toHaveLength(1);

            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);
            expect(lexResult.tokens[0].image).toBe('    ');
            expect(tokenMatcher(lexResult.tokens[1], INDENT)).toBe(true);
            expect(lexResult.tokens[1].image).toBe('      ');
            expect(indentStack.getLast()).toBe(6);
        });

        // Should not match
        test('should not match indentation after another token', () => {
            const input = 'TESTTOKEN    ';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(1);
            expect(tokenMatcher(lexResult.tokens[0], TESTTOKEN)).toBe(true);
            expect(indentStack.getLast()).toBe(0);
        });

        test('Should not match sucessive same indentation level', () => {
            const input = '    \n    ';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(1);
            expect(lexResult.groups.nl).toHaveLength(1);

            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);
            expect(lexResult.tokens[0].image).toBe('    ');
            expect(indentStack.getLast()).toBe(4);
        });

        test('Should not match lower indentation', () => {
            const input = '  \n    \n  ';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(3);
            expect(lexResult.groups.nl).toHaveLength(2);

            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);
            expect(lexResult.tokens[0].image).toBe('  ');
            expect(tokenMatcher(lexResult.tokens[1], INDENT)).toBe(true);
            expect(lexResult.tokens[1].image).toBe('    ');
            expect(tokenMatcher(lexResult.tokens[2], DEDENT)).toBe(true);
            expect(indentStack.getLast()).toBe(2);
        });
    });

    describe('INDENT token and lists(-)', () => {
        test('should match a single level of indentation at the start of a line with -', () => {
            const input = '    - ';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(2);
            expect(lexResult.tokens[0].image).toBe('    ');
            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);
            expect(tokenMatcher(lexResult.tokens[1], LINETOKEN)).toBe(true);
            expect(indentStack.getLast()).toBe(6);
        });

        test('should match a indentation after indentation with -', () => {
            const input = '    - \n        ';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(3);
            expect(lexResult.tokens[0].image).toBe('    ');
            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);

            expect(tokenMatcher(lexResult.tokens[1], LINETOKEN)).toBe(true);

            expect(lexResult.tokens[2].image).toBe('        ');
            expect(tokenMatcher(lexResult.tokens[2], INDENT)).toBe(true);
            expect(indentStack.getLast()).toBe(8);
        });

        test('should match a dedentation after indentation with -', () => {
            const input = '  \n    - \n  ';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(4);
            expect(lexResult.tokens[0].image).toBe('  ');
            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);

            expect(tokenMatcher(lexResult.tokens[1], INDENT)).toBe(true);
            expect(lexResult.tokens[1].image).toBe('    ');

            expect(tokenMatcher(lexResult.tokens[2], LINETOKEN)).toBe(true);

            expect(tokenMatcher(lexResult.tokens[3], DEDENT)).toBe(true);
            expect(indentStack.getLast()).toBe(2);
        });

        test('should not match second indentation with same level', () => {
            const input = '    - \n      ';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(2);
            expect(lexResult.tokens[0].image).toBe('    ');
            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);
            expect(tokenMatcher(lexResult.tokens[1], LINETOKEN)).toBe(true);
            expect(indentStack.getLast()).toBe(6);
        });
    });

    describe('DEDENT token', () => {
        test('should match a dedentation', () => {
            const input = '  \n    \n  ';

            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(3);
            expect(lexResult.tokens[0].image).toBe('  ');
            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);

            expect(tokenMatcher(lexResult.tokens[1], INDENT)).toBe(true);
            expect(lexResult.tokens[1].image).toBe('    ');

            expect(tokenMatcher(lexResult.tokens[2], DEDENT)).toBe(true);
            expect(indentStack.getLast()).toBe(2);
        });

        test('should match a dedentation after dedentation', () => {
            const input = '  \n    \n        \n    \n  ';

            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(5);
            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);
            expect(tokenMatcher(lexResult.tokens[1], INDENT)).toBe(true);
            expect(tokenMatcher(lexResult.tokens[2], INDENT)).toBe(true);

            expect(tokenMatcher(lexResult.tokens[3], DEDENT)).toBe(true);
            expect(tokenMatcher(lexResult.tokens[4], DEDENT)).toBe(true);
            expect(indentStack.getLast()).toBe(2);
        });

        test('should not match a dedentation whens on the same level', () => {
            const input = '  \n  ';
            const lexResult = testLexer.tokenize(input);

            expect(lexResult.tokens).toHaveLength(1);
            expect(lexResult.tokens[0].image).toBe('  ');
            expect(tokenMatcher(lexResult.tokens[0], INDENT)).toBe(true);
        });
    });
});
