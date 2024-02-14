/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { EnableDefaultToolsAction, hasBooleanProp } from '@eclipse-glsp/client';

export interface ExtendedEnableDefaultToolsAction extends EnableDefaultToolsAction {
   focusGraph: boolean;
}

export namespace ExtendedEnableDefaultToolsAction {
   export function is(object: unknown): object is ExtendedEnableDefaultToolsAction {
      return EnableDefaultToolsAction.is(object) && hasBooleanProp(object, 'focusGraph');
   }

   export function create(options: { focusGraph: boolean }): ExtendedEnableDefaultToolsAction {
      return {
         ...EnableDefaultToolsAction.create(),
         ...options
      };
   }
}
