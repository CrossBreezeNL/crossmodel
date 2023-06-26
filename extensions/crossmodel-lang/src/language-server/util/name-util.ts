/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { SystemDiagram } from '../generated/ast';

export function findAvailableNodeName(container: SystemDiagram, name: string): string {
   let availableName = name;
   let counter = 1;
   while (container.nodes.find(node => node.name === availableName)) {
      availableName = availableName + counter++;
   }
   return availableName;
}
