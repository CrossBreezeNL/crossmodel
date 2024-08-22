/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { quote } from '@crossbreeze/protocol';
import { isReference } from 'langium';
import { Serializer } from '../model-server/serializer.js';
import {
   CrossModelRoot,
   Entity,
   JoinCondition,
   Mapping,
   Relationship,
   StringLiteral,
   SystemDiagram,
   isAttributeMappingSource,
   isAttributeMappingTarget,
   isJoinCondition,
   isSourceObjectDependency
} from './generated/ast.js';
import { isImplicitProperty } from './util/ast-util.js';

const PROPERTY_ORDER = [
   'id',
   'name',
   'datatype',
   'identifier',
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
   'dependencies',
   'mappings',
   'source',
   'conditions',
   'expression',
   'customProperties',
   'value'
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
   'join',
   'conditions',
   'parent',
   'child',
   'dependencies',
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

   private serializeValue(value: any, indentationLevel: number, key: string, container?: Record<string, any>): string {
      if (this.isCustomProperty(container)) {
         // custom properties need a special handling because they use properties that are already used differently in other places
         // 'name:' typically used as a string but used as an identifier in the custom property
         // 'value:' used for ID-based references in other places but used as a string value in the custom property
         return key === 'name' ? value : JSON.stringify(value);
      }

      if (Array.isArray(value)) {
         return this.serializeArray(value, indentationLevel, key);
      } else if (typeof value === 'object' && value !== undefined) {
         return this.serializeObject(value, indentationLevel + CrossModelSerializer.INDENTATION_AMOUNT_OBJECT, key);
      } else if (this.isIdOrIdRef(key)) {
         // for IDs and references (based on IDs) we guarantee that they do not contain spaces or other characters that break the string
         return value;
      } else {
         return JSON.stringify(value);
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
               // skip empty arrays
               return;
            }
            if (objKey === 'identifier' && objValue === false) {
               // skip false identifiers for better readability
               return;
            }

            const propKey = this.serializeKey(objKey);
            const propValue = this.serializeValue(objValue, indentationLevel, propKey, obj);
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
         .filter(item => item !== undefined)
         .map(item => this.serializeValue(item, indentationLevel, key, arr))
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
      if (isAttributeMappingSource(obj) || isAttributeMappingTarget(obj)) {
         // skip object structure
         return this.resolvedValue(obj.value);
      }
      if (isSourceObjectDependency(obj)) {
         return this.resolvedValue(obj.source);
      }
      if (isJoinCondition(obj)) {
         // expressions are serialized not as the object tree but as user-level expression
         return this.serializeJoinCondition(obj);
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

   private serializeJoinCondition(obj: JoinCondition): any {
      const text = obj.$cstNode?.text?.trim();
      if (text) {
         return text;
      }
      const left = obj.expression.left.$type === StringLiteral ? quote(obj.expression.left.value) : obj.expression.left.value;
      const right = obj.expression.right.$type === StringLiteral ? quote(obj.expression.right.value) : obj.expression.right.value;
      return [left, obj.expression.op, right].join(' ');
   }

   private isCustomProperty(obj: any): obj is { name: string; value?: string } {
      // we need to be strict here cause other objects may also have name or value properties
      return (
         typeof obj === 'object' &&
         'name' in obj &&
         typeof (obj as any).name === 'string' &&
         (Object.keys(obj).length === 1 || (Object.keys(obj).length === 2 && 'value' in obj && typeof (obj as any).value === 'string'))
      );
   }
}
