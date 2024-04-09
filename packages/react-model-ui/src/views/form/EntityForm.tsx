/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { Entity } from '@crossbreeze/protocol';
import { TextField } from '@mui/material';
import * as React from 'react';
import { useEntity, useModelDispatch } from '../../ModelContext';
import { FormSection } from '../FormSection';
import { EntityAttributesDataGrid } from '../common';
import { Form } from './Form';

export interface EntityFormProps {
   entity: Entity;
}

export function EntityForm(): React.ReactElement {
   const dispatch = useModelDispatch();
   const entity = useEntity();

   return (
      <Form id={entity.id} name={entity.name ?? 'Entity'} iconClass='codicon-git-commit'>
         <FormSection label='General'>
            <TextField
               fullWidth={true}
               label='Name'
               margin='normal'
               variant='outlined'
               value={entity.name}
               onChange={event => dispatch({ type: 'entity:change-name', name: event.target.value ?? '' })}
            />

            <TextField
               fullWidth={true}
               label='Description'
               margin='normal'
               variant='outlined'
               multiline={true}
               rows={2}
               value={entity.description}
               onChange={event => dispatch({ type: 'entity:change-description', description: event.target.value ?? '' })}
            />
         </FormSection>
         <FormSection label='Attributes'>
            <EntityAttributesDataGrid />
         </FormSection>
      </Form>
   );
}
