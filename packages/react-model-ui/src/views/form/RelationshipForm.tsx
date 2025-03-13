/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { LogicalEntityType, ModelFileType, ModelStructure, ReferenceableElement } from '@crossbreeze/protocol';
import { Autocomplete, TextField } from '@mui/material';
import * as React from 'react';
import { useModelDispatch, useModelQueryApi, useReadonly, useRelationship } from '../../ModelContext';
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
   const readonly = useReadonly();

   const reference = React.useMemo(() => ({ container: { globalId: relationship!.id! }, property: 'parent' }), [relationship]);
   const referenceableElements = React.useCallback(() => api.findReferenceableElements(reference), [api, reference]);
   const referenceLabelProvider = (element: ReferenceableElement): string => element.label;

   const cardinalities = ['zero', 'one', 'multiple'];

   return (
      <Form id={relationship.id} name={relationship.name ?? ModelFileType.Relationship} iconClass={ModelStructure.Relationship.ICON_CLASS}>
         <FormSection label='General'>
            <TextField
               label='Name'
               value={relationship.name ?? ''}
               disabled={readonly}
               onChange={event => dispatch({ type: 'relationship:change-name', name: event.target.value ?? '' })}
            />

            <TextField
               label='Description'
               multiline={true}
               rows={2}
               value={relationship.description ?? ''}
               disabled={readonly}
               onChange={event => dispatch({ type: 'relationship:change-description', description: event.target.value ?? '' })}
            />

            <AsyncAutoComplete
               label='Parent *'
               optionLoader={referenceableElements}
               getOptionLabel={referenceLabelProvider}
               onChange={(_evt, newReference) => dispatch({ type: 'relationship:change-parent', parent: newReference.label })}
               value={{ uri: '', label: relationship.parent ?? '', type: LogicalEntityType }}
               disabled={readonly}
               selectOnFocus={true}
            />

            <Autocomplete
               options={cardinalities}
               disabled={readonly}
               handleHomeEndKeys={true}
               onChange={(_evt, newParentCardinality) =>
                  dispatch({ type: 'relationship:change-parent-cardinality', parentCardinality: newParentCardinality ?? '' })
               }
               renderInput={params => <TextField {...params} label='Parent Cardinality' value={relationship.parentCardinality ?? ''} />}
            />

            <AsyncAutoComplete
               label='Child *'
               optionLoader={referenceableElements}
               getOptionLabel={referenceLabelProvider}
               onChange={(_evt, newReference) => dispatch({ type: 'relationship:change-child', child: newReference.label })}
               value={{ uri: '', label: relationship.child ?? '', type: LogicalEntityType }}
               clearOnBlur={true}
               disabled={readonly}
               selectOnFocus={true}
            />

            <Autocomplete
               options={cardinalities}
               disabled={readonly}
               handleHomeEndKeys={true}
               onChange={(_evt, newChildCardinality) =>
                  dispatch({ type: 'relationship:change-child-cardinality', childCardinality: newChildCardinality ?? '' })
               }
               renderInput={params => <TextField {...params} label='Child Cardinality' value={relationship.childCardinality ?? ''} />}
            />
         </FormSection>
         <FormSection label='Attributes'>
            <RelationshipAttributesDataGrid />
         </FormSection>
      </Form>
   );
}

export const RelationshipComponent = themed(modelComponent(RelationshipForm));
