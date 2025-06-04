/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { SourceObjectJoinType } from '@crossmodel/protocol';
import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, TextField } from '@mui/material';
import * as React from 'react';
import { useMapping, useModelDispatch, useReadonly } from '../../ModelContext';
import { modelComponent } from '../../ModelViewer';
import { themed } from '../../ThemedViewer';
import { FormSection } from '../FormSection';
import { SourceObjectConditionDataGrid } from '../common/SourceObjectConditionDataGrid';
import { SourceObjectDependencyDataGrid } from '../common/SourceObjectDependencyDataGrid';
import { Form } from './Form';

export interface SourceObjectRenderProps {
   sourceObjectIndex: number;
}

export function SourceObjectForm(props: SourceObjectRenderProps): React.ReactElement {
   const mapping = useMapping();
   const dispatch = useModelDispatch();
   const readonly = useReadonly();
   const sourceObject = mapping.sources[props.sourceObjectIndex];
   if (!sourceObject) {
      return <></>;
   }

   const changeJoinType = (event: SelectChangeEvent): void => {
      dispatch({
         type: 'source-object:change-join',
         sourceObjectIdx: props.sourceObjectIndex,
         join: event.target.value as SourceObjectJoinType
      });
   };

   return (
      <Form id={mapping.id} name={sourceObject.id ?? 'Source Object'} iconClass='codicon-group-by-ref-type'>
         <FormSection label='General'>
            <TextField label='ID' value={sourceObject.id ?? ''} disabled={true} spellCheck={false} />
            <TextField label='Entity' value={sourceObject.entity ?? ''} disabled={true} spellCheck={false} />
            <FormControl sx={{ marginTop: 2, marginBottom: 2, marginLeft: 0, marginRight: 0, minWidth: 120 }} fullWidth={true}>
               <InputLabel id='join-label'>Join</InputLabel>
               <Select
                  labelId='join-label'
                  id='join-select'
                  value={sourceObject.join}
                  label='Join'
                  disabled={readonly}
                  onChange={changeJoinType}
                  fullWidth={true}
               >
                  <MenuItem value='from'>From</MenuItem>
                  <MenuItem value='inner-join'>Inner Join</MenuItem>
                  <MenuItem value='cross-join'>Cross Join</MenuItem>
                  <MenuItem value='left-join'>Left Join</MenuItem>
                  <MenuItem value='apply'>Apply</MenuItem>
               </Select>
            </FormControl>
         </FormSection>
         <FormSection label='Dependencies'>
            <SourceObjectDependencyDataGrid mapping={mapping} sourceObjectIdx={props.sourceObjectIndex} />
         </FormSection>
         <FormSection label='Conditions'>
            <SourceObjectConditionDataGrid mapping={mapping} sourceObjectIdx={props.sourceObjectIndex} />
         </FormSection>
      </Form>
   );
}

export const SourceObjectComponent = themed(modelComponent(SourceObjectForm));
