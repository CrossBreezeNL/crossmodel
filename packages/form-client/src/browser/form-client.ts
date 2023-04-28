/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { injectable } from '@theia/core/shared/inversify';
import { FormEditorClient } from '../common/form-client-protocol';

@injectable()
export class FormEditorClientImpl implements FormEditorClient {
   async getName(): Promise<string> {
      return 'Client';
   }
}
