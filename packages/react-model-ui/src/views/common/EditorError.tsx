/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { codiconCSSString } from '@crossbreezenl/protocol';
import React = require('react');

export function createEditorError(message: string): React.ReactNode {
   return (
      <div className='editor-diagnostics-error'>
         <span className={'editor-diagnostics-error-icon ' + codiconCSSString('error')} />
         <span className='editor-diagnostics-error-message'>{message}</span>
      </div>
   );
}
