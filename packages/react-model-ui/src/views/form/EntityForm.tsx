/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ModelFileType, ModelStructure } from '@crossbreeze/protocol';
import { TextField } from '@mui/material';
import * as React from 'react';
import { useEntity, useModelDispatch, useReadonly } from '../../ModelContext';
import { modelComponent } from '../../ModelViewer';
import { themed } from '../../ThemedViewer';
import { FormSection } from '../FormSection';
import { EntityAttributesDataGrid } from '../common';
import { Form } from './Form';

export function EntityForm(): React.ReactElement {
   const dispatch = useModelDispatch();
   const entity = useEntity();
   const readonly = useReadonly();

   return (
      <Form id={entity.id} name={entity.name ?? ModelFileType.Entity} iconClass={ModelStructure.Entity.ICON_CLASS}>
         <FormSection label='General'>
            <TextField
               fullWidth={true}
               label='Name'
               margin='normal'
               variant='outlined'
               disabled={readonly}
               value={entity.name ?? ''}
               onChange={event => dispatch({ type: 'entity:change-name', name: event.target.value ?? '' })}
            />

            <TextField
               fullWidth={true}
               label='Description'
               margin='normal'
               variant='outlined'
               disabled={readonly}
               multiline={true}
               rows={2}
               value={entity.description ?? ''}
               onChange={event => dispatch({ type: 'entity:change-description', description: event.target.value ?? '' })}
            />
         </FormSection>
         <FormSection label='Attributes'>
            <EntityAttributesDataGrid />
         </FormSection>
      </Form>
   );
}

export const EntityComponent = themed(modelComponent(EntityForm));
