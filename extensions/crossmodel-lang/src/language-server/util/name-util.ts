/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { SystemDiagram } from '../generated/ast.js';

export function findNextId(container: SystemDiagram, proposal: string): string {
   let nextId = proposal;
   let counter = 1;
   while (container.nodes.find(node => node.id === nextId)) {
      nextId = proposal + counter++;
   }
   return nextId;
}
