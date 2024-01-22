/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { GRID } from '@crossbreeze/protocol';
import { GridSnapper } from '@eclipse-glsp/client';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class CrossModelGridSnapper extends GridSnapper {
   constructor() {
      super(GRID);
   }
}
