/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
/* eslint-disable no-null/no-null */

import { IToken, Lexer, createToken, createTokenInstance } from 'chevrotain';
import _ from 'lodash';
import { indentStack } from './cross-model-indent-stack';
import { IndentationError } from './cross-model-lexer-error';

export const NAMES = {
    INDENT: 'INDENT',
    DEDENT: 'DEDENT',
    SPACES: 'SPACES',
    NEWLINE: 'NEWLINE'
};

export const NEWLINE = createToken({
    name: NAMES.NEWLINE,
    pattern: /\n|\r\n?/,
    group: 'nl'
});

// Spaces that are not an indent or dedent should be ignored
// Done by giving the group Lexer.SKIPPED
export const SPACES = createToken({
    name: NAMES.SPACES,
    pattern: / +/,
    group: Lexer.SKIPPED
});

export const INDENT = createToken({
    name: NAMES.INDENT,
    pattern: _.partialRight(matchIndentBase, 'indent'),
    // custom token patterns should explicitly specify the line_breaks option
    line_breaks: false
});

export const DEDENT = createToken({
    name: NAMES.DEDENT,
    pattern: _.partialRight(matchIndentBase, 'dedent'),
    // custom token patterns should explicitly specify the line_breaks option
    line_breaks: false
});

/**
 * Indentation/dedenentation tokens based on rules and returns the matched token.
 *
 * @param text The input text being analyzed.
 * @param offset The current offset in the input text.
 * @param matchedTokens An array of tokens that have been matched so far.
 * @param groups An object containing groups of tokens matched so far.
 * @param type The type of indentation to check for ("indent" or "dedent").
 * @returns The matched indent or dedent token. null if no indentation match is found.
 * @throws {IndentationError} If an invalid outdent is encountered.
 */
function matchIndentBase(text: string, offset: number, matchedTokens: IToken[], groups: any, type: string): RegExpExecArray | null {
    const noTokensMatchedYet = _.isEmpty(matchedTokens);
    const newLines: Array<IToken> = groups.nl;
    const noNewLinesMatchedYet = _.isEmpty(newLines);
    const isFirstLine = noTokensMatchedYet && noNewLinesMatchedYet;
    const last_newline = _.last(newLines);

    // Windows line endings are \r\n, linux is only \n. This variable accounts for that.
    const offset_match = /\r\n/.exec(last_newline?.image as string);
    const offset_newline = offset_match ? 2 : 1;

    const isStartOfLine =
        // only newlines matched so far
        (noTokensMatchedYet && !noNewLinesMatchedYet) ||
        // Both newlines and other Tokens have been matched AND the offset is just after the last newline
        (!noTokensMatchedYet && !noNewLinesMatchedYet && last_newline && offset === last_newline.startOffset + offset_newline);

    // indentation can only be matched at the start of a line.
    if (isFirstLine || isStartOfLine) {
        let currIndentLevel: number | undefined;
        const prevIndentLevel = indentStack.getLast();

        const wsRegExp = /[ ]+/y;
        wsRegExp.lastIndex = offset;
        const match = wsRegExp.exec(text);

        // possible non-empty indentation
        if (match !== null) {
            currIndentLevel = match[0].length;

            // To get the - working for the lists
            const minusRegex = /-[ ]*/y;
            minusRegex.lastIndex = match[0].length + offset;
            const minusMatch = minusRegex.exec(text);
            if (minusMatch) {
                currIndentLevel = currIndentLevel + minusMatch[0].length;
            }
        }
        // "empty" indentation means indentLevel of 0.
        else {
            currIndentLevel = 0;
        }

        // deeper indentation
        if (currIndentLevel > prevIndentLevel && type === 'indent') {
            indentStack.push(currIndentLevel);
            return match;
        }
        // shallower indentation
        else if (currIndentLevel < prevIndentLevel && type === 'dedent') {
            const matchIndentIndex = indentStack.findLastIndex(currIndentLevel);

            // any outdent must match some previous indentation level.
            if (matchIndentIndex === -1) {
                throw new IndentationError(`invalid outdent at offset: ${offset}`);
            }

            const numberOfDedents = indentStack.length() - matchIndentIndex - 1;

            // This is a little tricky
            // 1. If there is no match (0 level indent) than this custom token
            //    matcher would return "null" and so we need to add all the required outdents ourselves.
            // 2. If there was match (> 0 level indent) than we need to add minus one number of outdents
            //    because the lexer would create one due to returning a none null result.
            const iStart = match !== null ? 1 : 0;
            for (let i = iStart; i < numberOfDedents; i++) {
                indentStack.pop();
                matchedTokens.push(createTokenInstance(DEDENT, NAMES.DEDENT, offset, offset, newLines.length, newLines.length, 0, 0));
            }

            // even though we are adding fewer outdents directly we still need to update the indent stack fully.
            if (iStart === 1) {
                indentStack.pop();
            }
            return match;
        } else {
            // same indent, this should be lexed as simple whitespace and ignored
            return null;
        }
    } else {
        // indentation cannot be matched under other circumstances
        return null;
    }
}
