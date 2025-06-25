/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import {
   computeRelationshipName,
   CrossModelValidationErrors,
   ModelFileType,
   ModelStructure,
   ReferenceableElement,
   toId
} from '@crossmodel/protocol';
import { Autocomplete, TextField } from '@mui/material';
import * as React from 'react';
import { useDiagnostics, useModelDispatch, useModelQueryApi, useReadonly, useRelationship, useUntitled, useUri } from '../../ModelContext';
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
   const baseDiagnostics = useDiagnostics();
   const untitled = useUntitled();
   const uri = useUri();
   const diagnostics = React.useMemo(() => CrossModelValidationErrors.getFieldErrors(baseDiagnostics), [baseDiagnostics]);

   const usingDefaultName = React.useMemo(
      () => relationship.name === computeRelationshipName(relationship.parent, relationship.child),
      [relationship.name, relationship.parent, relationship.child]
   );

   const reference = React.useMemo(() => ({ container: { globalId: relationship!.id! }, property: 'parent' }), [relationship]);
   const referenceableElements = React.useCallback(
      () => api.findReferenceableElements(reference).then(references => references.map(referenceLabelProvider)),
      [api, reference]
   );
   const referenceLabelProvider = (element: ReferenceableElement): string => element.label;

   const cardinalities = ['zero', 'one', 'multiple'];

   const updateNameAndId = React.useCallback(
      (parent?: string, child?: string) => {
         const name = computeRelationshipName(parent, child);
         const proposal = toId(name);
         dispatch({ type: 'relationship:change-name', name });
         api.findNextId({ uri, type: relationship.$type, proposal }).then(id => dispatch({ type: 'relationship:change-id', id }));
      },
      [dispatch, api, uri, relationship]
   );

   const handleParentChange = React.useCallback(
      (_: React.SyntheticEvent, newParentRef: string) => {
         dispatch({ type: 'relationship:change-parent', parent: newParentRef });
         if (untitled && usingDefaultName) {
            updateNameAndId(newParentRef, relationship.child);
         }
      },
      [dispatch, untitled, usingDefaultName, relationship, updateNameAndId]
   );

   const handleChildChange = React.useCallback(
      (_: React.SyntheticEvent, newChildRef: string) => {
         dispatch({ type: 'relationship:change-child', child: newChildRef });
         if (untitled && usingDefaultName) {
            updateNameAndId(relationship.parent, newChildRef);
         }
      },
      [dispatch, untitled, usingDefaultName, relationship, updateNameAndId]
   );

   const handleNameChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
         dispatch({ type: 'relationship:change-name', name: event.target.value ?? '' });
         if (untitled) {
            api.findNextId({ uri, type: relationship.$type, proposal: toId(event.target.value) }).then(id =>
               dispatch({ type: 'relationship:change-id', id })
            );
         }
      },
      [untitled, dispatch, api, uri, relationship]
   );

   return (
      <Form id={relationship.id} name={relationship.name ?? ModelFileType.Relationship} iconClass={ModelStructure.Relationship.ICON_CLASS}>
         <FormSection label='General'>
            <TextField
               label='Name'
               value={relationship.name ?? ''}
               disabled={readonly}
               error={!!diagnostics.name?.length}
               helperText={diagnostics.name?.at(0)?.message}
               onChange={handleNameChange}
               required={true}
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
               label='Parent'
               optionLoader={referenceableElements}
               textFieldProps={{ required: true, helperText: diagnostics.parent?.at(0)?.message, error: !!diagnostics.parent?.length }}
               onChange={handleParentChange}
               value={relationship.parent ?? ''}
               disabled={readonly}
               selectOnFocus={true}
            />

            <Autocomplete
               options={cardinalities}
               disabled={readonly}
               handleHomeEndKeys={true}
               value={relationship.parentCardinality ?? ''}
               onChange={(_evt, newParentCardinality) =>
                  dispatch({ type: 'relationship:change-parent-cardinality', parentCardinality: newParentCardinality ?? '' })
               }
               renderInput={params => <TextField {...params} label='Parent Cardinality' />}
            />

            <AsyncAutoComplete
               label='Child'
               optionLoader={referenceableElements}
               textFieldProps={{ required: true, helperText: diagnostics.child?.at(0)?.message, error: !!diagnostics.child?.length }}
               onChange={handleChildChange}
               value={relationship.child ?? ''}
               clearOnBlur={true}
               disabled={readonly}
               selectOnFocus={true}
            />

            <Autocomplete
               options={cardinalities}
               disabled={readonly}
               handleHomeEndKeys={true}
               value={relationship.childCardinality ?? ''}
               onChange={(_evt, newChildCardinality) =>
                  dispatch({ type: 'relationship:change-child-cardinality', childCardinality: newChildCardinality ?? '' })
               }
               renderInput={params => <TextField {...params} label='Child Cardinality' />}
            />
         </FormSection>
         <FormSection label='Attributes'>
            <RelationshipAttributesDataGrid diagnostics={diagnostics} />
         </FormSection>
      </Form>
   );
}

export const RelationshipComponent = themed(modelComponent(RelationshipForm));
