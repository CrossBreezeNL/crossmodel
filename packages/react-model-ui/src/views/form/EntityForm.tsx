/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelValidationErrors, ModelFileType, ModelStructure, toId } from '@crossmodel/protocol';
import { TextField } from '@mui/material';
import * as React from 'react';
import { useDiagnostics, useEntity, useModelDispatch, useModelQueryApi, useReadonly, useUntitled, useUri } from '../../ModelContext';
import { modelComponent } from '../../ModelViewer';
import { themed } from '../../ThemedViewer';
import { FormSection } from '../FormSection';
import { EntityAttributesDataGrid } from '../common';
import { EntityCustomPropertiesDataGrid } from '../common/EntityCustomPropertiesDataGrid';
import { Form } from './Form';

export function EntityForm(): React.ReactElement {
   const dispatch = useModelDispatch();
   const entity = useEntity();
   const api = useModelQueryApi();
   const untitled = useUntitled();
   const uri = useUri();
   const readonly = useReadonly();
   const diagnostics = CrossModelValidationErrors.getFieldErrors(useDiagnostics());

   const handleNameChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
         dispatch({ type: 'entity:change-name', name: event.target.value ?? '' });
         if (untitled) {
            api.findNextId({ uri, type: entity.$type, proposal: toId(event.target.value) }).then(id =>
               dispatch({ type: 'entity:change-id', id })
            );
         }
      },
      [untitled, dispatch, api, uri, entity]
   );

   return (
      <Form id={entity.id} name={entity.name ?? ModelFileType.LogicalEntity} iconClass={ModelStructure.LogicalEntity.ICON_CLASS}>
         <FormSection label='General'>
            <TextField
               fullWidth={true}
               label='Name'
               margin='normal'
               variant='outlined'
               disabled={readonly}
               required={true}
               value={entity.name ?? ''}
               error={!!diagnostics.name?.length}
               helperText={diagnostics.name?.at(0)?.message}
               onChange={handleNameChange}
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
               error={!!diagnostics.description?.length}
               helperText={diagnostics.description?.at(0)?.message}
               onChange={event => dispatch({ type: 'entity:change-description', description: event.target.value ?? '' })}
            />
         </FormSection>
         <FormSection label='Attributes'>
            <EntityAttributesDataGrid />
         </FormSection>
         <FormSection label='Custom properties'>
            <EntityCustomPropertiesDataGrid />
         </FormSection>
      </Form>
   );
}

export const EntityComponent = themed(modelComponent(EntityForm));
