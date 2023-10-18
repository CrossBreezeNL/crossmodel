/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AstNode, LangiumDocument, LangiumServices } from 'langium';
import { URI } from 'vscode-uri';

export async function parseDocument<T extends AstNode = AstNode>(services: LangiumServices, input: string): Promise<LangiumDocument<T>> {
    const document = await parseHelper<T>(services)(input);
    if (!document.parseResult) {
        throw new Error('Could not parse document');
    }
    return document;
}

export function parseHelper<T extends AstNode = AstNode>(services: LangiumServices): (input: string) => Promise<LangiumDocument<T>> {
    const metaData = services.LanguageMetaData;
    const documentBuilder = services.shared.workspace.DocumentBuilder;
    return async input => {
        const randomNumber = Math.floor(Math.random() * 10000000) + 1000000;
        const uri = URI.parse(`file:///${randomNumber}${metaData.fileExtensions[0]}`);
        const document = services.shared.workspace.LangiumDocumentFactory.fromString<T>(input, uri);
        services.shared.workspace.LangiumDocuments.addDocument(document);
        await documentBuilder.build([document]);
        return document;
    };
}
