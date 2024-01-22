/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AbstractLayoutConfigurator, LayoutOptions, configureELKLayoutModule } from '@eclipse-glsp/layout-elk';
import { GGraph } from '@eclipse-glsp/server';
import { ContainerModule, injectable } from 'inversify';

@injectable()
export class CrossModelLayoutConfigurator extends AbstractLayoutConfigurator {
   protected override graphOptions(graph: GGraph): LayoutOptions | undefined {
      return {
         'elk.algorithm': 'layered'
      };
   }
}

export function createLayoutModule(): ContainerModule {
   // use Eclipse Layout Kernel with our custom layered layout configuration
   return configureELKLayoutModule({ algorithms: ['layered'], layoutConfigurator: CrossModelLayoutConfigurator });
}
