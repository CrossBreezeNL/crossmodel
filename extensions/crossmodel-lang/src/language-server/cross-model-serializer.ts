/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { isReference } from 'langium';
import { Serializer } from '../model-server/serializer';
import { CrossModelServices } from './cross-model-module';
import { CrossModelRoot, Entity, Relationship, SystemDiagram } from './generated/ast';

/**
 * Hand-written AST serializer as there is currently no out-of-the box serializer from Langium, but it is on the roadmap.
 * cf. https://github.com/langium/langium/discussions/683
 * cf. https://github.com/langium/langium/discussions/863
 */
export class CrossModelSerializer implements Serializer<CrossModelRoot> {
    constructor(protected services: CrossModelServices, protected refNameProvider = services.references.QualifiedNameProvider) {}

    serialize(root: CrossModelRoot): string {
        const newRoot: CrossModelRoot | Entity | Relationship | SystemDiagram = this.toSerializableObject(root);
        return this.serializeValue(newRoot, -4);
    }

    private serializeValue(value: any, indentationLevel: number): string {
        if (Array.isArray(value)) {
            return this.serializeArray(value, indentationLevel);
        } else if (typeof value === 'object' && value !== undefined) {
            return this.serializeObject(value, indentationLevel + 4);
        } else {
            return JSON.stringify(value);
        }
    }

    private serializeObject(obj: Record<string, any>, indentationLevel: number): string {
        const indentation = ' '.repeat(indentationLevel);

        const serializedProperties = Object.entries(obj)
            .map(([key, value]) => {
                if (Array.isArray(value) && value.length === 0) {
                    return;
                }

                const serializedValue = this.serializeValue(value, indentationLevel);

                if (key === 'name_val') {
                    key = 'name';
                } else if (key === 'name') {
                    key = 'id';
                }

                if (typeof value === 'object') {
                    return `${indentation}${key}:\n${serializedValue}`;
                } else {
                    return `${indentation}${key}: ${serializedValue}`;
                }
            })
            .filter(item => item !== undefined);

        return serializedProperties.join('\n');
    }

    private serializeArray(arr: any[], indentationLevel: number): string {
        const serializedItems = arr
            .map(item => this.serializeValue(item, indentationLevel))
            .map(item => this.changeCharInString(item, indentationLevel + 2, '-'))
            .join('\n');
        return serializedItems;
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
    toSerializableObject<T extends object>(obj: T): T {
        return <T>Object.entries(obj)
            .filter(([key, value]) => !key.startsWith('$'))
            .reduce((acc, [key, value]) => ({ ...acc, [key]: this.cleanValue(value) }), {});
    }

    cleanValue(value: any): any {
        if (Array.isArray(value)) {
            return value.map(item => this.cleanValue(item));
        } else if (this.isContainedObject(value)) {
            return this.toSerializableObject(value);
        } else {
            return this.resolvedValue(value);
        }
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
