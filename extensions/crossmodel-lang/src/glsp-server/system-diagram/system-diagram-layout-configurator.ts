/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/
import { AbstractLayoutConfigurator, LayoutOptions } from '@eclipse-glsp/layout-elk';
import { GGraph } from '@eclipse-glsp/server';
import { injectable } from 'inversify';

@injectable()
export class SystemDiagramLayoutConfigurator extends AbstractLayoutConfigurator {
   protected override graphOptions(graph: GGraph): LayoutOptions | undefined {
      return {
         'elk.algorithm': 'layered'
      };
   }
}
