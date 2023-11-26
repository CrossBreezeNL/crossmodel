/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { beforeEach, describe, expect, test } from '@jest/globals';
import { indentStack } from '../../../src/language-server/lexer/cross-model-indent-stack.js';

describe('IndentStack', () => {
   beforeEach(() => {
      indentStack.reset();
   });

   describe('get', () => {
      test('should return a copy of the current stack', () => {
         indentStack.push(2);
         indentStack.push(4);

         const stack = indentStack.get();

         expect(stack).toEqual([0, 2, 4]);
      });

      test('should return an [0] if the stack is empty', () => {
         const stack = indentStack.get();

         expect(stack).toEqual([0]);
      });

      test('should not modify the original stack when modifying the returned array', () => {
         indentStack.push(2);
         indentStack.push(4);

         const stack = indentStack.get();
         stack.pop(); // Modify the returned array

         expect(stack).toEqual([0, 2]); // The returned array is modified
         expect(indentStack.get()).toEqual([0, 2, 4]); // The original stack remains unchanged
      });
   });

   describe('push', () => {
      test('should push the given value onto the stack', () => {
         indentStack.push(2);
         expect(indentStack.get()).toEqual([0, 2]);
      });

      test('should push multiple values onto the stack', () => {
         indentStack.push(2);
         indentStack.push(4);
         indentStack.push(6);
         expect(indentStack.get()).toEqual([0, 2, 4, 6]);
      });
   });

   describe('reset', () => {
      test('should reset the stack to contain only the initial indentation level', () => {
         indentStack.push(2);
         indentStack.push(4);
         indentStack.reset();
         expect(indentStack.get()).toEqual([0]);
      });
   });

   describe('pop', () => {
      test('should remove and return the topmost indentation level from the stack', () => {
         indentStack.push(2);

         const poppedValue = indentStack.pop();

         expect(poppedValue).toBe(2);
         expect(indentStack.get()).toEqual([0]);
      });

      test('should return undefined if the stack is empty', () => {
         // Pop 0 after reset
         const poppedValue1 = indentStack.pop();
         const poppedValue2 = indentStack.pop();

         expect(poppedValue1).toBe(0);
         expect(poppedValue2).toBeUndefined();
      });
   });

   describe('length', () => {
      test('should return 1 when only the initial indentation level is present', () => {
         expect(indentStack.length()).toBe(1);
      });

      test('should return the length of indentation levels in the stack', () => {
         indentStack.push(2);
         indentStack.push(4);
         expect(indentStack.length()).toBe(3);
      });
   });

   describe('getLast', () => {
      test('should return the last indentation level from the stack', () => {
         indentStack.push(2);
         indentStack.push(4);

         const lastValue = indentStack.getLast();

         expect(lastValue).toBe(4);
      });

      test('should throw an IndentStackError if the stack is empty', () => {
         indentStack.pop();

         expect(() => indentStack.getLast()).toThrow();
      });
   });

   describe('findLastIndex', () => {
      test('should return the index of the last occurrence of the given value in the stack', () => {
         indentStack.push(2);
         indentStack.push(4);
         indentStack.push(2);

         const lastIndex = indentStack.findLastIndex(2);

         expect(lastIndex).toBe(3);
      });

      test('should return -1 if the given value is not found in the stack', () => {
         const lastIndex = indentStack.findLastIndex(2);
         expect(lastIndex).toBe(-1);
      });
   });
});
