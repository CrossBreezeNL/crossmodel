/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as monaco from '@theia/monaco-editor-core';

monaco.languages.register({
   id: 'jsonc',
   aliases: ['JSON with Comments'],
   filenames: ['package.json']
});
