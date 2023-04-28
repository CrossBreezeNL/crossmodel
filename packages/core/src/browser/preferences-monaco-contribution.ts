/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as monaco from '@theia/monaco-editor-core';

// ensure that 'package.json' files are opened with 'jsonc' to have support for comments and syntax highlighting
monaco.languages.register({
   id: 'jsonc',
   aliases: ['JSON with Comments'],
   filenames: ['package.json']
});
