/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import type {
   LangiumGeneratedServices,
   LangiumGeneratedSharedServices,
   LangiumServices,
   LangiumSharedServices,
   LanguageMetaData,
   Module
} from 'langium';
import { CrossModelAstReflection } from './ast.js';
import { CrossModelGrammar } from './grammar.js';

export const CrossModelLanguageMetaData = {
   languageId: 'cross-model',
   fileExtensions: ['.cm'],
   caseInsensitive: false
} as const satisfies LanguageMetaData;

export const CrossModelGeneratedSharedModule: Module<LangiumSharedServices, LangiumGeneratedSharedServices> = {
   AstReflection: () => new CrossModelAstReflection()
};

export const CrossModelGeneratedModule: Module<LangiumServices, LangiumGeneratedServices> = {
   Grammar: () => CrossModelGrammar(),
   LanguageMetaData: () => CrossModelLanguageMetaData,
   parser: {}
};
