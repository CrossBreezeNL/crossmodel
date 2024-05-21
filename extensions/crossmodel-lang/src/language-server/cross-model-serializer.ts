/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { quote } from '@crossbreeze/protocol';
import { isReference } from 'langium';
import { Serializer } from '../model-server/serializer.js';
import {
   AttributeMappingSource,
   AttributeMappingTarget,
   CrossModelRoot,
   Entity,
   JoinExpression,
   Mapping,
   Relationship,
   SystemDiagram,
   isAttributeMappingSource,
   isAttributeMappingTarget,
   isJoinExpression,
   isNumberLiteral,
   isReferenceSource,
   isStringLiteral
} from './generated/ast.js';
import { isImplicitProperty } from './util/ast-util.js';

const PROPERTY_ORDER = [
   'id',
   'name',
   'datatype',
   'description',
   'entity',
   'parent',
   'child',
   'type',
   'attributes',
   'nodes',
   'edges',
   'x',
   'y',
   'width',
   'height',
   'relationship',
   'sourceNode',
   'targetNode',
   'attribute',
   'sources',
   'target',
   'object',
   'join',
   'relations',
   'mappings',
   'source',
   'conditions',
   'expression'
];

const ID_OR_IDREF = [
   'id',
   'relationship',
   'entity',
   'sourceNode',
   'targetNode',
   'object',
   'source',
   'sources',
   'target',
   'attribute',
   'from',
   'join',
   'parent',
   'child',
   'value'
];

/** Mapping from JavaScript property keys (AST) to YAML property keys (Grammar). */
const PROPERTY_TO_KEY_MAP = new Map();

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
      const newRoot: CrossModelRoot | Entity | Relationship | SystemDiagram | Mapping = this.toSerializableObject(root);
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
         .map(([objKey, objValue]) => {
            if (Array.isArray(objValue) && objValue.length === 0) {
               return;
            }

            const propKey = this.serializeKey(objKey);
            const propValue = this.serializeValue(objValue, indentationLevel, propKey);
            if (typeof objValue === 'object') {
               return `${indentation}${propKey}:${CrossModelSerializer.CHAR_NEWLINE}${propValue}`;
            } else {
               return `${indentation}${propKey}: ${propValue}`;
            }
         })
         .filter(item => item !== undefined);

      return serializedProperties.join(CrossModelSerializer.CHAR_NEWLINE);
   }

   private serializeKey(property: string): string {
      return PROPERTY_TO_KEY_MAP.get(property) ?? property;
   }

   private serializeArray(arr: any[], indentationLevel: number, key: string): string {
      const serializedItems = arr
         .map(item => this.serializeValue(item, indentationLevel, key))
         .map(item => this.ensureArrayItem(item, indentationLevel + CrossModelSerializer.INDENTATION_AMOUNT_ARRAY))
         .join(CrossModelSerializer.CHAR_NEWLINE);
      return serializedItems;
   }

   private ensureArrayItem(input: any, indentationLevel: number): string {
      if (indentationLevel < 0) {
         return input;
      }

      const indentation = CrossModelSerializer.CHAR_INDENTATION.repeat(indentationLevel);
      const modifiedString = indentation + '- ' + input.toString().trimStart();
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
      // preprocess some objects that need special serialization
      if (isAttributeMappingSource(obj)) {
         // sources are simply serialized as their value instead of object structure
         return this.serializeAttributeMappingSource(obj);
      }
      if (isAttributeMappingTarget(obj)) {
         // sources are simply serialized as their value instead of object structure
         return this.serializeAttributeMappingTarget(obj);
      }
      if (isJoinExpression(obj)) {
         // expressions are serialized not as the object tree but as user-level expression
         return this.serializeJoinExpression(obj);
      }
      return <T>Object.entries(obj)
         .filter(([key, value]) => !key.startsWith('$') && !isImplicitProperty(key, obj))
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

   private serializeAttributeMappingSource(obj: AttributeMappingSource): any {
      if (isReferenceSource(obj)) {
         return this.resolvedValue(obj.value);
      }
      if (isNumberLiteral(obj)) {
         return obj.value;
      }
      if (isStringLiteral(obj)) {
         return quote(obj.value);
      }
      return '';
   }

   private serializeAttributeMappingTarget(obj: AttributeMappingTarget): any {
      return this.resolvedValue(obj.value);
   }

   private serializeJoinExpression(obj: JoinExpression): any {
      return this.resolvedValue(obj.source) + ' ' + obj.operator + ' ' + this.resolvedValue(obj.target);
   }
}
