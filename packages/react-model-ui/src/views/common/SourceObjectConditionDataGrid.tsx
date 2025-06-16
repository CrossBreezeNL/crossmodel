/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
   BinaryExpression,
   BinaryExpressionType,
   CrossReferenceContext,
   JoinConditionType,
   Mapping,
   NumberLiteralType,
   ReferenceableElement,
   SourceObject,
   SourceObjectAttributeReferenceType,
   SourceObjectCondition,
   StringLiteralType,
   quote
} from '@crossmodel/protocol';
import { DataGridProps, GridColDef, GridRenderEditCellParams, useGridApiContext } from '@mui/x-data-grid';
import * as React from 'react';
import { useModelDispatch, useModelQueryApi, useReadonly } from '../../ModelContext';
import AsyncAutoComplete from './AsyncAutoComplete';
import GridComponent, { GridComponentRow } from './GridComponent';

export interface EditSourceObjectConditionComponentProps extends GridRenderEditCellParams<BinaryExpression> {
   field: 'left' | 'right';
   sourceObject: SourceObject;
}

export function EditSourceObjectConditionComponent({
   id,
   row,
   field,
   hasFocus,
   sourceObject
}: EditSourceObjectConditionComponentProps): React.ReactElement {
   const queryApi = useModelQueryApi();
   const gridApi = useGridApiContext();
   const readonly = useReadonly();

   const referenceCtx: CrossReferenceContext = React.useMemo(
      () => ({
         container: { globalId: sourceObject.$globalId },
         syntheticElements: [
            { property: 'conditions', type: JoinConditionType },
            { property: 'expression', type: BinaryExpressionType },
            { property: field, type: SourceObjectAttributeReferenceType }
         ],
         property: 'value'
      }),
      [field, sourceObject.$globalId]
   );
   const referenceableElements = React.useCallback(() => queryApi.findReferenceableElements(referenceCtx), [queryApi, referenceCtx]);

   const handleValueChange = React.useCallback(
      (_evt: React.SyntheticEvent, newValue: ReferenceableElement | string): void => {
         const literal = typeof newValue === 'string';
         const fieldValue = literal ? newValue : newValue.label;
         const $type = literal ? (isNaN(parseFloat(newValue)) ? StringLiteralType : NumberLiteralType) : SourceObjectAttributeReferenceType;
         gridApi.current.setEditCellValue({ id, field, value: { $type, value: fieldValue } });
      },
      [field, gridApi, id]
   );

   const value = React.useMemo<ReferenceableElement>(
      () => ({ uri: '', label: row[field]?.value?.toString() ?? '', type: row.$type }),
      [field, row]
   );

   return (
      <AsyncAutoComplete<ReferenceableElement>
         openOnFocus={true}
         fullWidth={true}
         label=''
         optionLoader={referenceableElements}
         onChange={handleValueChange}
         value={value}
         clearOnBlur={true}
         disabled={readonly}
         selectOnFocus={true}
         freeSolo={true as any}
         textFieldProps={{ sx: { margin: '0' }, autoFocus: hasFocus, placeholder: 'Select a source object or specify a string or number' }}
         isOptionEqualToValue={(option, val) => option.label === val.label}
      />
   );
}

export type SourceObjectConditionRow = GridComponentRow<BinaryExpression>;

export interface SourceObjectConditionDataGridProps extends Omit<DataGridProps<BinaryExpression>, 'rows' | 'columns' | 'processRowUpdate'> {
   mapping: Mapping;
   sourceObjectIdx: number;
}

export function SourceObjectConditionDataGrid({
   mapping,
   sourceObjectIdx,
   ...props
}: SourceObjectConditionDataGridProps): React.ReactElement {
   const dispatch = useModelDispatch();
   const readonly = useReadonly();

   const sourceObject = React.useMemo<SourceObject>(() => mapping.sources[sourceObjectIdx], [mapping.sources, sourceObjectIdx]);

   const conditions = React.useMemo<BinaryExpression[]>(
      () => sourceObject?.conditions?.map(condition => condition.expression) ?? [],
      [sourceObject?.conditions]
   );

   const defaultCondition = React.useMemo<BinaryExpression>(
      () => ({
         $type: BinaryExpressionType,
         left: { $type: 'StringLiteral', value: '' },
         op: '=',
         right: { $type: 'StringLiteral', value: '' }
      }),
      []
   );

   const handleConditionUpdate = React.useCallback(
      (row: SourceObjectConditionRow): SourceObjectConditionRow => {
         if (row.left.value === '' && row.right.value === '' && row.op === '=') {
            dispatch({ type: 'source-object:delete-condition', sourceObjectIdx, conditionIdx: row.idx });
         } else {
            const expression: BinaryExpression & { idx?: number } = { ...row };
            delete expression.idx;
            const condition: SourceObjectCondition = { $type: 'JoinCondition', expression };
            dispatch({
               type: 'source-object:update-condition',
               sourceObjectIdx,
               conditionIdx: row.idx,
               condition
            });
         }
         return row;
      },
      [dispatch, sourceObjectIdx]
   );

   const handleAddCondition = React.useCallback(
      (row: SourceObjectConditionRow): void => {
         if (row.left.value !== '' || row.right.value !== '' || row.op !== '=') {
            const condition: SourceObjectCondition = { $type: 'JoinCondition', expression: row };
            dispatch({ type: 'source-object:add-condition', sourceObjectIdx, condition });
         }
      },
      [dispatch, sourceObjectIdx]
   );

   const handleConditionUpward = React.useCallback(
      (row: SourceObjectConditionRow): void =>
         dispatch({ type: 'source-object:move-condition-up', sourceObjectIdx, conditionIdx: row.idx }),
      [dispatch, sourceObjectIdx]
   );

   const handleConditionDownward = React.useCallback(
      (row: SourceObjectConditionRow): void =>
         dispatch({ type: 'source-object:move-condition-up', sourceObjectIdx, conditionIdx: row.idx }),
      [dispatch, sourceObjectIdx]
   );

   const handleConditionDelete = React.useCallback(
      (row: SourceObjectConditionRow): void => dispatch({ type: 'source-object:delete-condition', sourceObjectIdx, conditionIdx: row.idx }),
      [dispatch, sourceObjectIdx]
   );

   const columns: GridColDef<BinaryExpression>[] = React.useMemo(
      () => [
         {
            field: 'left',
            flex: 200,
            editable: !readonly,
            renderHeader: () => 'Left',
            valueGetter: (_value, row) => row.left,
            valueFormatter: (value, row) => (row.left.$type === 'StringLiteral' ? quote(row.left.value) : row.left.value),
            renderEditCell: params => <EditSourceObjectConditionComponent {...params} field='left' sourceObject={sourceObject} />,
            type: 'singleSelect'
         },
         {
            field: 'op',
            flex: 50,
            editable: !readonly,
            renderHeader: () => 'Operator',
            type: 'singleSelect',
            valueOptions: ['=', '!=', '<', '<=', '>', '>=']
         },
         {
            field: 'right',
            flex: 200,
            editable: !readonly,
            renderHeader: () => 'Right',
            valueGetter: (_value, row) => row.right,
            valueFormatter: (value, row) => (row.right.$type === 'StringLiteral' ? quote(row.right.value) : row.right.value),
            renderEditCell: params => <EditSourceObjectConditionComponent {...params} field='right' sourceObject={sourceObject} />,
            type: 'singleSelect'
         }
      ],
      [readonly, sourceObject]
   );

   return (
      <GridComponent
         {...props}
         autoHeight
         gridColumns={columns}
         gridData={conditions}
         noEntriesText={'No Conditions'}
         newEntryText='Add Condition'
         defaultEntry={defaultCondition}
         onAdd={handleAddCondition}
         onDelete={handleConditionDelete}
         onUpdate={handleConditionUpdate}
         onMoveDown={handleConditionDownward}
         onMoveUp={handleConditionUpward}
      />
   );
}
