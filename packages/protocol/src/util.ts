/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelRegex } from './model-service/protocol';

export function quote(text: string, quoteChar = '"', replaceChar = "'"): string {
   let quoted = text;
   if (!quoted.startsWith(quoteChar)) {
      quoted = quoteChar + quoted;
   }
   if (!quoted.endsWith(quoteChar)) {
      quoted += quoteChar;
   }
   // escape any occurrence of quote char within the quoted text
   return (
      quoteChar +
      quoted
         .substring(1, quoted.length - 1)
         .split(quoteChar)
         .join(replaceChar) +
      quoteChar
   );
}

export function toId(text: string): string {
   if (CrossModelRegex.ID.test(text)) {
      return text;
   }
   let id = text;
   // replace all non-matching characters with '_'
   id = id.replace(/[^\w_\-~$#@/\d]/g, '_');
   if (CrossModelRegex.ID.test(id)) {
      return id;
   }
   // prefix with '_' if necessary
   return '_' + id;
}
