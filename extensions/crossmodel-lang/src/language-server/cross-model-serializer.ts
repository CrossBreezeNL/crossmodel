/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { isReference } from 'langium';
import { Serializer } from '../model-server/serializer.js';
import { CrossModelRoot, Entity, Relationship, SystemDiagram } from './generated/ast.js';

const PROPERTY_ORDER = [
   'id',
   'name',
   'datatype',
   'description',
   'entity',
   'attributes',
   'parent',
   'child',
   'type',
   'nodes',
   'edges',
   'x',
   'y',
   'width',
   'height',
   'relationship',
   'sourceNode',
   'targetNode',
   'sources',
   'target',
   'object',
   'join',
   'relations',
   'attribute',
   'source',
   'conditions'
];

const ID_OR_IDREF = [
   'id',
   'relationship',
   'entity',
   'sourceNode',
   'targetNode',
   'object',
   'source',
   'target',
   'attribute',
   'from',
   'parent',
   'child'
];

/**
 * Hand-written AST serializer as there is currently no out-of-the box serializer from Langium, but it is on the roadmap.
 * cf. https://github.com/langium/langium/discussions/683
 * cf. https://github.com/langium/langium/discussions/863
 */
export class CrossModelSerializer implements Serializer<CrossModelRoot> {
   // New line character.
   static readonly CHAR_NEWLINE = '\n';
   // Indentation character.
   static readonly CHAR_INDENTATION = ' ';
   // The amount of spaces to use to indent an object.
   static readonly INDENTATION_AMOUNT_OBJECT = 4;
   // The amount of spaces to use to indent an array.
   static readonly INDENTATION_AMOUNT_ARRAY = 2;

   serialize(root: CrossModelRoot): string {
      const newRoot: CrossModelRoot | Entity | Relationship | SystemDiagram = this.toSerializableObject(root);
      return this.serializeValue(newRoot, CrossModelSerializer.INDENTATION_AMOUNT_OBJECT * -1, 'root');
   }

   private serializeValue(value: any, indentationLevel: number, key: string): string {
      if (Array.isArray(value)) {
         return this.serializeArray(value, indentationLevel, key);
      } else if (typeof value === 'object' && value !== undefined) {
         return this.serializeObject(value, indentationLevel + CrossModelSerializer.INDENTATION_AMOUNT_OBJECT, key);
      } else {
         return this.isIdOrIdRef(key) ? value : JSON.stringify(value);
      }
   }

   private isIdOrIdRef(key: string): boolean {
      return ID_OR_IDREF.includes(key);
   }

   private serializeObject(obj: Record<string, any>, indentationLevel: number, key: string): string {
      const indentation = CrossModelSerializer.CHAR_INDENTATION.repeat(indentationLevel);

      const serializedProperties = Object.entries(obj)
         .sort((left, right) => PROPERTY_ORDER.indexOf(left[0]) - PROPERTY_ORDER.indexOf(right[0]))
         .map(([propKey, value]) => {
            if (Array.isArray(value) && value.length === 0) {
               return;
            }

            const propValue = this.serializeValue(value, indentationLevel, propKey);
            if (typeof value === 'object') {
               return `${indentation}${propKey}:${CrossModelSerializer.CHAR_NEWLINE}${propValue}`;
            } else {
               return `${indentation}${propKey}: ${propValue}`;
            }
         })
         .filter(item => item !== undefined);

      return serializedProperties.join(CrossModelSerializer.CHAR_NEWLINE);
   }

   private serializeArray(arr: any[], indentationLevel: number, key: string): string {
      const serializedItems = arr
         .map(item => this.serializeValue(item, indentationLevel, key))
         .map(item => this.changeCharInString(item, indentationLevel + CrossModelSerializer.INDENTATION_AMOUNT_ARRAY, '-'))
         .join(CrossModelSerializer.CHAR_NEWLINE);
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
