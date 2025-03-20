/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/

import type { ModelDiagnostic } from './protocol';
export namespace CrossModelValidationErrors {
   export const FilenameNotMatching = 'filename-not-matching';

   export const toMissing = (field: string): string => `missing-${field}`;
   export const toMalformed = (field: string): string => `malformed-${field}`;
   export const isMissing = (code?: string | number): string | false =>
      typeof code === 'string' && code.startsWith('missing-') && code.slice(8);
   export const isMalformed = (code?: string | number): string | false =>
      typeof code === 'string' && code.startsWith('malformed-') && code.slice(10);
   export const getFieldErrors = (diagnostics: ModelDiagnostic[]): Record<string, ModelDiagnostic[] | undefined> => {
      const result: Record<string, ModelDiagnostic[]> = {};
      for (const diagnostic of diagnostics) {
         const field = isMissing(diagnostic.code) || isMalformed(diagnostic.code);
         if (field) {
            result[field] ??= [];
            result[field].push(diagnostic);
         }
      }
      return result;
   };
}
