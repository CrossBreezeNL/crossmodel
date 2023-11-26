/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import _ from 'lodash';
import { IndentStackError } from './cross-model-lexer-error.js';

/**
 * Class to hold the current indentation levels. Has a few basic functions to handle
 * basic operations.
 */
class IndentStack {
   /**
    * Stack to store the indentation levels.
    */
   private stack: number[] = [0];

   /**
    * Retrieves a copy of the current stack.
    * @returns {number[]} A copy of the current stack.
    */
   public get(): number[] {
      return [...this.stack];
   }

   /**
    * Pushes a new indentation level onto the stack.
    * @param {number} value - The indentation level to push.
    */
   public push(value: number): void {
      this.stack.push(value);
   }

   /**
    * Resets the stack to contain only the initial indentation level.
    */
   public reset(): void {
      this.stack = [0];
   }

   /**
    * Removes and returns the topmost indentation level from the stack.
    * @returns {number | undefined} The popped indentation level, or undefined if the stack is empty.
    */
   public pop(): number | undefined {
      return this.stack.pop();
   }

   /**
    * Returns the length of indentation levels in the stack.
    * @returns {number} The length of the stack.
    */
   public length(): number {
      return this.stack.length;
   }

   /**
    * Retrieves the last indentation level from the stack.
    * @returns {number} The last indentation level.
    * @throws {Error} If the stack is empty.
    */
   public getLast(): number {
      const lastValue = _.last(this.stack);

      if (lastValue === undefined) {
         throw new IndentStackError('Indent stack is empty.');
      }

      return lastValue;
   }

   /**
    * Finds the last index of the specified indentation level in the stack.
    * @param {number} value - The indentation level to search for.
    * @returns {number} The index of the last occurrence of the indentation level, or -1 if not found.
    */
   public findLastIndex(value: number): number {
      return this.stack.lastIndexOf(value);
   }
}

export const indentStack = new IndentStack();
