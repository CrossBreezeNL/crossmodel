/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { OpenInNewOutlined, SaveOutlined } from '@mui/icons-material';
import { AppBar, Box, Button, Icon, Toolbar, Typography } from '@mui/material';
import { useDiagnostics, useDirty, useModelOpen, useModelSave } from '../../ModelContext';
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
         <Toolbar variant='dense' sx={{ minHeight: '40px' }}>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexGrow: 1, gap: '1em', alignItems: 'center' }}>
               {iconClass && <Icon baseClassName='codicon' className={iconClass} sx={{ fontSize: '1.7em !important' }} />}
               <Typography variant='h6' component='div'>
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
         {diagnostics.length > 0 && (
            <Toolbar
               variant='dense'
               className='diagnostics-readonly'
               sx={{ backgroundColor: 'var(--theia-errorBackground)', color: 'var(--theia-errorForeground)', minHeight: '25px' }}
            >
               <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexGrow: 1, gap: '0.2em', alignItems: 'center' }}>
                  {iconClass && <Icon baseClassName='codicon' className={'codicon-error'} sx={{ fontSize: '1em !important' }} />}
                  <Typography variant='caption' component='div'>
                     Model has errors and is set to read-only. Please fix the errors in the code editor.
                  </Typography>
               </Box>
            </Toolbar>
         )}
      </AppBar>
   );
}
