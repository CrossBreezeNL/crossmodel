/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { GridManager, IDiagramStartup, MaybePromise } from '@eclipse-glsp/client';
import { inject, injectable, optional } from '@theia/core/shared/inversify';

@injectable()
export class CrossModelDiagramStartup implements IDiagramStartup {
   rank = -1;

   @inject(GridManager) @optional() protected gridManager?: GridManager;

   preRequestModel(): MaybePromise<void> {
      this.gridManager?.setGridVisible(true);
   }
}
