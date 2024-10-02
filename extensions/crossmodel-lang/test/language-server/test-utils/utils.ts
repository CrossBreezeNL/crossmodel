/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { EmptyFileSystem, LangiumDocument } from 'langium';
import { LangiumServices } from 'langium/lsp';
import { ParseHelperOptions, parseDocument as langiumParseDocument } from 'langium/test';
import { CrossModelServices, createCrossModelServices } from '../../../src/language-server/cross-model-module.js';
import {
   CrossModelRoot,
   Entity,
   Mapping,
   Relationship,
   SystemDiagram,
   isEntity,
   isMapping,
   isRelationship,
   isSystemDiagram
} from '../../../src/language-server/generated/ast.js';
import { SemanticRoot, TypeGuard, WithDocument, findSemanticRoot } from '../../../src/language-server/util/ast-util.js';

export function createCrossModelTestServices(): CrossModelServices {
   return createCrossModelServices({ ...EmptyFileSystem }).CrossModel;
}

export const parseDocument = langiumParseDocument<CrossModelRoot>;

export interface ParseInput<T = string | string[]> extends ParseHelperOptions {
   services: LangiumServices;
   text: T;
}

export interface ParseAssert {
   lexerErrors?: number;
   parserErrors?: number;
}

export async function parseDocuments(
   services: LangiumServices,
   inputs: string[],
   options?: ParseHelperOptions
): Promise<LangiumDocument<CrossModelRoot>[]> {
   return Promise.all(inputs.map(input => parseDocument(services, input, options)));
}

export async function parseSemanticRoot<T extends SemanticRoot>(
   input: ParseInput<string>,
   assert: ParseAssert,
   guard: TypeGuard<T>
): Promise<WithDocument<T>> {
   const document = await parseDocument(input.services, input.text, input);
   expect(document.parseResult.lexerErrors).toHaveLength(assert.lexerErrors ?? 0);
   expect(document.parseResult.parserErrors).toHaveLength(assert.parserErrors ?? 0);
   const semanticRoot = findSemanticRoot(document, guard);
   expect(semanticRoot).toBeDefined();
   (semanticRoot as any).$document = document;
   return semanticRoot as WithDocument<T>;
}

export async function parseEntity(input: ParseInput<string>, assert: ParseAssert = {}): Promise<WithDocument<Entity>> {
   return parseSemanticRoot(input, assert, isEntity);
}

export async function parseRelationship(input: ParseInput<string>, assert: ParseAssert = {}): Promise<WithDocument<Relationship>> {
   return parseSemanticRoot(input, assert, isRelationship);
}

export async function parseSystemDiagram(input: ParseInput<string>, assert: ParseAssert = {}): Promise<WithDocument<SystemDiagram>> {
   return parseSemanticRoot(input, assert, isSystemDiagram);
}

export async function parseMapping(input: ParseInput<string>, assert: ParseAssert = {}): Promise<WithDocument<Mapping>> {
   return parseSemanticRoot(input, assert, isMapping);
}
