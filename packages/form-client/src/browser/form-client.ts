/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { injectable } from '@theia/core/shared/inversify';
import { FormEditorClient } from '../common/form-client-protocol';

@injectable()
export class FormEditorClientImpl implements FormEditorClient {
   getName(): Promise<string> {
      return new Promise(resolve => resolve('Client'));
   }
}
