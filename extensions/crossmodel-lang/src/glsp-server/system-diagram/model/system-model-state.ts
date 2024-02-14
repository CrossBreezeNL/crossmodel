/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { inject, injectable } from 'inversify';
import { CrossModelState } from '../../common/cross-model-state.js';
import { SystemModelIndex } from './system-model-index.js';
import { SystemDiagram } from '../../../language-server/generated/ast.js';

@injectable()
export class SystemModelState extends CrossModelState {
   @inject(SystemModelIndex) override readonly index!: SystemModelIndex;

   get systemDiagram(): SystemDiagram {
      return this.semanticRoot.systemDiagram!;
   }
}
