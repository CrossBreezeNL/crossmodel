/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { TextField } from '@mui/material';
import * as React from 'react';
import { useMapping, useModelDispatch, useReadonly } from '../../ModelContext';
import { modelComponent } from '../../ModelViewer';
import { themed } from '../../ThemedViewer';
import { FormSection } from '../FormSection';
import { AttributeMappingSourcesDataGrid } from '../common/AttributeMappingSourcesDataGrid';
import { Form } from './Form';

export interface MappingRenderProps {
   mappingIndex: number;
}

export function MappingForm(props: MappingRenderProps): React.ReactElement {
   const mapping = useMapping();
   const dispatch = useModelDispatch();
   const readonly = useReadonly();

   const attributeMapping = mapping.target.mappings[props.mappingIndex];
   if (!attributeMapping) {
      return <></>;
   }

   return (
      <Form
         id={mapping.id}
         name={attributeMapping.attribute?.value ?? mapping.target.entity ?? 'Mapping'}
         iconClass='codicon-group-by-ref-type'
      >
         <FormSection label='General'>
            <TextField label='Target Attribute' value={attributeMapping.attribute?.value ?? ''} disabled={true} spellCheck={false} />
            <TextField
               label='Expression'
               value={attributeMapping.expression ?? ''}
               disabled={readonly}
               onChange={event =>
                  dispatch({
                     type: 'attribute-mapping:change-expression',
                     mappingIdx: props.mappingIndex,
                     expression: event.target.value ?? ''
                  })
               }
            />
         </FormSection>
         <FormSection label='Sources'>
            <AttributeMappingSourcesDataGrid mapping={attributeMapping} mappingIdx={props.mappingIndex} />
         </FormSection>
      </Form>
   );
}

export const MappingComponent = themed(modelComponent(MappingForm));
