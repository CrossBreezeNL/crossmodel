/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AstNode, DefaultLangiumDocuments, EmptyFileSystem, LangiumDocument, LangiumServices } from 'langium';
import { ParseHelperOptions, clearDocuments, parseDocument } from 'langium/test';
import { CrossModelServices, createCrossModelServices } from '../../../src/language-server/cross-model-module.js';

export { parseDocument } from 'langium/test';

export function createCrossModelTestServices(): CrossModelServices {
   const services = createCrossModelServices({ ...EmptyFileSystem }).CrossModel;
   services.shared.workspace.LangiumDocuments = new DefaultLangiumDocuments(services.shared);
   return services;
}

export async function parseDocuments<T extends AstNode = AstNode>(
   services: LangiumServices,
   inputs: string[],
   options?: ParseHelperOptions
): Promise<LangiumDocument<T>[]> {
   return Promise.all(inputs.map(input => parseDocument<T>(services, input, options)));
}

export async function parseAndForgetDocument<T extends AstNode = AstNode>(
   services: LangiumServices,
   input: string,
   options?: ParseHelperOptions
): Promise<LangiumDocument<T>> {
   const document = await parseDocument<T>(services, input, options);
   await clearDocuments(services, [document]);
   return document;
}
