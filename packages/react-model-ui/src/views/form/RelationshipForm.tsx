/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { EntityType, ModelFileType, ModelStructure, ReferenceableElement } from '@crossbreeze/protocol';
import { TextField } from '@mui/material';
import * as React from 'react';
import { useModelDispatch, useModelQueryApi, useRelationship } from '../../ModelContext';
import { modelComponent } from '../../ModelViewer';
import { themed } from '../../ThemedViewer';
import { FormSection } from '../FormSection';
import AsyncAutoComplete from '../common/AsyncAutoComplete';
import { RelationshipAttributesDataGrid } from '../common/RelationshipAttributesDataGrid';
import { Form } from './Form';

// Form with tabs to edit an relationship's properties and attributes.
export function RelationshipForm(): React.ReactElement {
   const dispatch = useModelDispatch();
   const api = useModelQueryApi();
   const relationship = useRelationship();

   const reference = React.useMemo(() => ({ container: { globalId: relationship!.id! }, property: 'parent' }), [relationship]);
   const referenceableElements = React.useCallback(() => api.findReferenceableElements(reference), [api, reference]);
   const labelProvider = (element: ReferenceableElement): string => element.label;

   return (
      <Form id={relationship.id} name={relationship.name ?? ModelFileType.Relationship} iconClass={ModelStructure.Relationship.ICON}>
         <FormSection label='General'>
            <TextField
               label='Name'
               value={relationship.name ?? ''}
               onChange={event => dispatch({ type: 'relationship:change-name', name: event.target.value ?? '' })}
            />

            <TextField
               label='Description'
               multiline={true}
               rows={2}
               value={relationship.description ?? ''}
               onChange={event => dispatch({ type: 'relationship:change-description', description: event.target.value ?? '' })}
            />

            <TextField
               label='Type *'
               value={relationship.type ?? ''}
               onChange={event => dispatch({ type: 'relationship:change-type', newType: event.target.value ?? '' })}
            />

            <AsyncAutoComplete
               label='Parent *'
               optionLoader={referenceableElements}
               getOptionLabel={labelProvider}
               onChange={(_evt, newReference) => dispatch({ type: 'relationship:change-parent', parent: newReference.label })}
               value={{ uri: '', label: relationship.parent ?? '', type: EntityType }}
               selectOnFocus={true}
            />

            <AsyncAutoComplete
               label='Child *'
               optionLoader={referenceableElements}
               getOptionLabel={labelProvider}
               onChange={(_evt, newReference) => dispatch({ type: 'relationship:change-child', child: newReference.label })}
               value={{ uri: '', label: relationship.child ?? '', type: EntityType }}
               clearOnBlur={true}
               selectOnFocus={true}
            />
         </FormSection>
         <FormSection label='Attributes'>
            <RelationshipAttributesDataGrid />
         </FormSection>
      </Form>
   );
}

export const RelationshipComponent = themed(modelComponent(RelationshipForm));
