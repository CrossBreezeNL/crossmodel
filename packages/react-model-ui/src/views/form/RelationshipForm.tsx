/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import {
   computeRelationshipName,
   CrossModelValidationErrors,
   ModelFileType,
   ModelStructure,
   ReferenceableElement
} from '@crossbreezenl/protocol';
import { Autocomplete, TextField } from '@mui/material';
import * as React from 'react';
import { useDiagnostics, useModelDispatch, useModelQueryApi, useReadonly, useRelationship, useUntitled } from '../../ModelContext';
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
   const diagnostics = CrossModelValidationErrors.getFieldErrors(baseDiagnostics);

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

   const handleParentChange = React.useCallback(
      (_: React.SyntheticEvent, newRef: string) => {
         dispatch({ type: 'relationship:change-parent', parent: newRef });
         if (untitled && usingDefaultName) {
            dispatch({ type: 'relationship:change-name', name: computeRelationshipName(newRef, relationship.child) });
         }
      },
      [dispatch, untitled, usingDefaultName, relationship]
   );

   const handleChildChange = React.useCallback(
      (_: React.SyntheticEvent, newRef: string) => {
         dispatch({ type: 'relationship:change-child', child: newRef });
         if (untitled && usingDefaultName) {
            dispatch({ type: 'relationship:change-name', name: computeRelationshipName(relationship.parent, newRef) });
         }
      },
      [dispatch, untitled, usingDefaultName, relationship]
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
               onChange={event => dispatch({ type: 'relationship:change-name', name: event.target.value ?? '' })}
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
               value={relationship.parent}
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
               label='Child'
               optionLoader={referenceableElements}
               textFieldProps={{ required: true, helperText: diagnostics.child?.at(0)?.message, error: !!diagnostics.child?.length }}
               onChange={handleChildChange}
               value={relationship.child}
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
            <RelationshipAttributesDataGrid diagnostics={diagnostics} />
         </FormSection>
      </Form>
   );
}

export const RelationshipComponent = themed(modelComponent(RelationshipForm));
