/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { DefaultTokenBuilder, TokenBuilderOptions } from 'langium';
import { Grammar, TerminalRule } from 'langium/lib/grammar/generated/ast';
import { TokenType, TokenVocabulary } from 'chevrotain';
import { DEDENT, INDENT, NEWLINE, SPACES, NAMES } from './cross-model-indentation-tokens';

/**
 * Custom implementation of TokenBuilder for the CrossModel language.
 * Overrides the default behavior to handle custom indentation tokens.
 */
export class CrossModelTokenBuilder extends DefaultTokenBuilder {
    /**
     * Overrides the base implementation to handle custom indentation tokens.
     *
     * Makes use of the overridden method but shifts around the given tokens to make
     * it working with indentation.
     *
     * @param grammar The grammar of the language.
     * @param options
     * @returns The token vocabulary for the language.
     * @throws Error if any of the required custom indentation tokens (SPACES, INDENT, DEDENT, NEWLINE) is missing in the grammar.
     */
    override buildTokens(grammar: Grammar, options?: TokenBuilderOptions): TokenVocabulary {
        const tokens: TokenType[] = super.buildTokens(grammar, options) as TokenType[];

        const updatedTokens: TokenType[] = [];
        let tokenWithSpaces: TokenType | undefined = undefined;
        let tokenIndent: TokenType | undefined = undefined;
        let tokenDedent: TokenType | undefined = undefined;
        let tokenNewLine: TokenType | undefined = undefined;

        for (const token of tokens) {
            if (token.name === NAMES.SPACES) {
                tokenWithSpaces = token;
            } else if (token.name === NAMES.DEDENT) {
                tokenDedent = token;
            } else if (token.name === NAMES.INDENT) {
                tokenIndent = token;
            } else if (token.name === NAMES.NEWLINE) {
                tokenNewLine = token;
            } else {
                updatedTokens.push(token);
            }
        }

        if (!tokenWithSpaces || !tokenIndent || !tokenDedent || !tokenNewLine) {
            throw new Error('Missing indentation, new line or spaces tokens in grammar');
        }

        updatedTokens.push(tokenWithSpaces);
        updatedTokens.unshift(tokenNewLine, tokenDedent, tokenIndent);

        return updatedTokens;
    }

    /**
     * Build a terminal token for the given TerminalRule.
     * Overrides the base implementation to handle custom indentation tokens.
     *
     * @param terminal The TerminalRule for which to build the token.
     * @returns The TokenType representing the terminal token.
     *
     */
    protected override buildTerminalToken(terminal: TerminalRule): TokenType {
        let token;

        if (terminal.name === NAMES.NEWLINE) {
            token = NEWLINE;
        } else if (terminal.name === NAMES.INDENT) {
            token = INDENT;
        } else if (terminal.name === NAMES.DEDENT) {
            token = DEDENT;
        } else if (terminal.name === NAMES.SPACES) {
            token = SPACES;
        } else {
            token = super.buildTerminalToken(terminal);
        }

        return token;
    }
}
