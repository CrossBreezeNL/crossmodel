/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AstNode, isReference } from 'langium';
import { Serializer } from '../model-server/serializer';
import { CrossModelServices } from './cross-model-module';
import { CrossModelRoot } from './generated/ast';

/**
 * Hand-written AST serializer as there is currently no out-of-the box serializer from Langium, but it is on the roadmap.
 * cf. https://github.com/langium/langium/discussions/683
 * cf. https://github.com/langium/langium/discussions/863
 */
export class CrossModelSerializer implements Serializer<CrossModelRoot> {
    constructor(protected services: CrossModelServices, protected refNameProvider = services.references.QualifiedNameProvider) {}

    serialize(root: CrossModelRoot): string {
        let newRoot: AstNode | undefined = this.toSerializableObject(root);

        let startKey;

        if (root.entity) {
            startKey = 'entity';
            newRoot = root.entity;
        } else if (root.diagram) {
            startKey = 'diagram';
            newRoot = root.diagram;
        } else if (root.relationship) {
            startKey = 'relationship';
            newRoot = root.diagram;
        } else {
            return '';
        }

        return startKey + ':' + '\n    ' + this.serializeValue(newRoot, 0);
    }

    private serializeValue(value: any, indentationLevel: number): string {
        if (typeof value === 'object' && value !== undefined) {
            return this.serializeObject(value, indentationLevel + 4);
        } else if (Array.isArray(value)) {
            return this.serializeArray(value, indentationLevel + 4);
        } else {
            return JSON.stringify(value);
        }
    }

    private serializeObject(obj: Record<string, any>, indentationLevel: number): string {
        const indentation = ' '.repeat(indentationLevel);

        const serializedProperties = Object.entries(obj).map(([key, value]) => {
            const serializedValue = this.serializeValue(value, indentationLevel);
            return `${indentation}${key}: ${serializedValue}`;
        });

        return serializedProperties.join(',\n') + '\n';
    }

    private serializeArray(arr: any[], indentationLevel: number): string {
        let serializedItems = arr.map(item => this.serializeValue(item, indentationLevel)).join('\n');
        serializedItems = this.changeCharInString(serializedItems, indentationLevel - 2, '-');

        return serializedItems + '\n';
    }

    private changeCharInString(inputString: string, indexToChange: number, newChar: any): string {
        if (indexToChange < 0 || indexToChange >= inputString.length) {
            throw Error('invalid');
        }

        const modifiedString = inputString.slice(0, indexToChange) + newChar + inputString.slice(indexToChange + 1);
        return modifiedString;
    }

    /**
     * Cleans the semantic object of any property that cannot be serialized as a String and thus cannot be sent to the client
     * over the RPC connection.
     *
     * @param obj semantic object
     * @returns serializable semantic object
     */
    toSerializableObject<T extends object>(obj?: T): T | undefined {
        if (!obj) {
            return;
        }

        return <T>Object.entries(obj)
            .filter(([key, value]) => !key.startsWith('$'))
            .reduce((acc, [key, value]) => ({ ...acc, [key]: this.cleanValue(value) }), {});
    }

    cleanValue(value: any): any {
        return this.isContainedObject(value) ? this.toSerializableObject(value) : this.resolvedValue(value);
    }

    isContainedObject(value: any): boolean {
        return value === Object(value) && !isReference(value);
    }

    resolvedValue(value: any): any {
        if (isReference(value)) {
            return value.$refText;
        }
        return value;
    }
}
