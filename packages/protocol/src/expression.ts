/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

export const EXPRESSION_REGEX = /{{(.*?)}}/g;

export function findAllExpressions(text?: string): RegExpMatchArray[] {
   return text ? Array.from(text.matchAll(EXPRESSION_REGEX)) : [];
}

export function findAllExpressionContents(text: string | undefined, trim = true): string[] {
   return findAllExpressions(text).map(match => getExpressionText(match, trim));
}

export function getExpressionPosition(expression: RegExpMatchArray): number {
   return expression.index ?? 0;
}

export function getExpression(expression: RegExpMatchArray): string {
   return expression[0];
}

export function getExpressionText(expression: RegExpMatchArray, trim = true): string {
   return trim ? expression[1].trim() : expression[1];
}

export function isExpressionStart(text: string): boolean {
   return text.trimEnd().endsWith('{{');
}
