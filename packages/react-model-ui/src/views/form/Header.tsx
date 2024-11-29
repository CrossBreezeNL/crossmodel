/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { ERRONEOUS_MODEL } from '@crossbreeze/protocol';
import { OpenInNewOutlined, SaveOutlined } from '@mui/icons-material';
import { AppBar, Box, Button, Icon, Toolbar, Typography } from '@mui/material';
import { useDiagnostics, useDirty, useModelOpen, useModelSave } from '../../ModelContext';
import { createEditorError } from '../common/EditorError';
import React = require('react');

export interface HeaderProps {
   name: string;
   id?: string;
   iconClass?: string;
}

export function Header({ name, id, iconClass }: HeaderProps): React.ReactElement {
   const saveModel = useModelSave();
   const openModel = useModelOpen();
   const dirty = useDirty();
   const diagnostics = useDiagnostics();

   return (
      <AppBar position='sticky'>
         {ModelDiagnostic.hasErrors(diagnostics) && createEditorError(ERRONEOUS_MODEL)}
         <Toolbar variant='dense' sx={{ minHeight: '40px' }}>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexGrow: 1, gap: '1em', alignItems: 'center' }}>
               {iconClass && <Icon baseClassName='codicon' className={iconClass} sx={{ fontSize: '1.7em !important' }} />}
               <Typography variant='h6' component='div' className='form-title'>
                  {name}
                  {saveModel && dirty ? '*' : ''}
               </Typography>
               <Typography variant='overline' component='div' sx={{ pt: '.5em' }}>
                  ID: {id}
               </Typography>
            </Box>

            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
               {openModel && (
                  <Button onClick={openModel} startIcon={<OpenInNewOutlined />} color='inherit'>
                     Open
                  </Button>
               )}
               {saveModel && (
                  <Button onClick={saveModel} startIcon={<SaveOutlined />} color='inherit' disabled={!dirty}>
                     Save
                  </Button>
               )}
            </Box>
         </Toolbar>
      </AppBar>
   );
}
