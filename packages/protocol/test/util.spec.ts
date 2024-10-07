/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { describe, expect, test } from '@jest/globals';
import { codiconCSSString, findNextUnique, identity, quote, toId, unquote } from '../src/util';

describe('quote', () => {
   test('should quote a string with default quote character', () => {
      expect(quote('hello')).toBe('"hello"');
   });

   test('should quote a string with custom quote character', () => {
      expect(quote('hello', "'")).toBe("'hello'");
   });

   test('should escape internal quote characters', () => {
      expect(quote('he"llo')).toBe('"he\'llo"');
   });

   test('should not quote an already quoted string', () => {
      expect(quote('"hello"')).toBe('"hello"');
   });

   test('should properly quote an empty string', () => {
      expect(quote('')).toBe('""');
   });

   test('should accept custom replace character', () => {
      expect(quote('he"llo', '"', '_')).toBe('"he_llo"');
   });
});

describe('unquote', () => {
   test('should unquote a string with default quote character', () => {
      expect(unquote('"hello"')).toBe('hello');
   });

   test('should unquote a string with custom quote character', () => {
      expect(unquote("'hello'", "'")).toBe('hello');
   });

   test('should return the same string if not quoted', () => {
      expect(unquote('hello')).toBe('hello');
   });
});

describe('toId', () => {
   test('should return the same string if it matches the ID regex', () => {
      expect(toId('valid_id')).toBe('valid_id');
   });

   test('should replace invalid characters with underscores', () => {
      expect(toId('invalid id')).toBe('invalid_id');
   });

   test('should remove diacritics', () => {
      expect(toId('äöü')).toBe('aou');
   });

   test('should prefix with underscore if necessary', () => {
      expect(toId('123invalid')).toBe('_123invalid');
   });
});

describe('codiconCSSString', () => {
   test('should return the correct CSS class string', () => {
      expect(codiconCSSString('icon-name')).toBe('codicon codicon-icon-name');
   });
});

describe('identity', () => {
   test('should return the same value', () => {
      const value = { key: 'value' };
      expect(identity(value)).toBe(value);
   });
});

describe('findNextUnique', () => {
   test('should return the suggestion if it is unique', () => {
      const existing = ['name1', 'name2'];
      expect(findNextUnique('name3', existing, identity)).toBe('name3');
   });

   test('should return a unique name by appending a number', () => {
      const existing = ['name1', 'name2'];
      expect(findNextUnique('name1', existing, identity)).toBe('name11');
   });

   test('should handle multiple conflicts', () => {
      const existing = ['name1', 'name11', 'name12'];
      expect(findNextUnique('name1', existing, identity)).toBe('name13');
   });

   test('should handle an empty array', () => {
      expect(findNextUnique('name1', [], identity)).toBe('name1');
   });

   test('should handle an empty suggestion', () => {
      expect(findNextUnique('', [], identity)).toBe('');
   });

   test('should properly extract the name', () => {
      const existing = [{ name: 'name1' }, { name: 'name2' }];
      expect(findNextUnique('name3', existing, e => e.name)).toBe('name3');
   });
});
