/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { inject, injectable } from 'inversify';
import { CrossModelState } from '../../common/cross-model-state.js';
import { MappingModelIndex } from './mapping-model-index.js';
import { Mapping } from '../../../language-server/generated/ast.js';

@injectable()
export class MappingModelState extends CrossModelState {
   @inject(MappingModelIndex) override readonly index!: MappingModelIndex;

   get mapping(): Mapping {
      return this.semanticRoot.mapping!;
   }
}
