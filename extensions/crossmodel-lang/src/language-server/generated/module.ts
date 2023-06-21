/******************************************************************************
 * This file was generated by langium-cli 1.2.1.
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

import type { LangiumGeneratedServices, LangiumGeneratedSharedServices, LangiumSharedServices, LangiumServices, LanguageMetaData, Module } from 'langium';
import { CrossModelAstReflection } from './ast';
import { CrossModelGrammar } from './grammar';

export const CrossModelLanguageMetaData: LanguageMetaData = {
    languageId: 'cross-model',
    fileExtensions: ['.cm'],
    caseInsensitive: false
};

export const CrossModelGeneratedSharedModule: Module<LangiumSharedServices, LangiumGeneratedSharedServices> = {
    AstReflection: () => new CrossModelAstReflection()
};

export const CrossModelGeneratedModule: Module<LangiumServices, LangiumGeneratedServices> = {
    Grammar: () => CrossModelGrammar(),
    LanguageMetaData: () => CrossModelLanguageMetaData,
    parser: {}
};
