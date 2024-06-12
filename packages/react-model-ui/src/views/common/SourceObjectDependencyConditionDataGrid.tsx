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
   SourceObjectDependency,
   SourceObjectDependencyCondition,
   SourceObjectDependencyType,
   StringLiteralType,
   quote
} from '@crossbreeze/protocol';
import { DataGridProps, GridColDef, GridRenderEditCellParams, useGridApiContext } from '@mui/x-data-grid';
import * as React from 'react';
import { useModelDispatch, useModelQueryApi } from '../../ModelContext';
import AsyncAutoComplete from './AsyncAutoComplete';
import GridComponent, { GridComponentRow } from './GridComponent';

export interface EditSourceObjectDependencyConditionComponentProps extends GridRenderEditCellParams<BinaryExpression> {
   field: 'left' | 'right';
   sourceObject: SourceObject;
   dependency: SourceObjectDependency;
}

export function EditSourceObjectDependencyConditionComponent({
   id,
   row,
   field,
   hasFocus,
   sourceObject,
   dependency
}: EditSourceObjectDependencyConditionComponentProps): React.ReactElement {
   const queryApi = useModelQueryApi();
   const gridApi = useGridApiContext();

   const referenceCtx: CrossReferenceContext = React.useMemo(
      () => ({
         container: { globalId: sourceObject.$globalId },
         syntheticElements: [
            { property: 'dependencies', type: SourceObjectDependencyType, source: { $refText: dependency.source } },
            { property: 'conditions', type: JoinConditionType },
            { property: 'expression', type: BinaryExpressionType },
            { property: field, type: SourceObjectAttributeReferenceType }
         ],
         property: 'value'
      }),
      [dependency.source, field, sourceObject.$globalId]
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
         selectOnFocus={true}
         freeSolo={true as any}
         textFieldProps={{ sx: { margin: '0' }, autoFocus: hasFocus, placeholder: 'Select a source object or specify a string or number' }}
         isOptionEqualToValue={(option, val) => option.label === val.label}
      />
   );
}

export type SourceObjectDependencyConditionRow = GridComponentRow<BinaryExpression>;

export interface SourceObjectDependencyConditionDataGridProps
   extends Omit<DataGridProps<BinaryExpression>, 'rows' | 'columns' | 'processRowUpdate'> {
   mapping: Mapping;
   sourceObjectIdx: number;
   dependencyIdx: number;
}

export function SourceObjectDependencyConditionDataGrid({
   mapping,
   sourceObjectIdx,
   dependencyIdx,
   ...props
}: SourceObjectDependencyConditionDataGridProps): React.ReactElement {
   const dispatch = useModelDispatch();

   const sourceObject = React.useMemo<SourceObject>(() => mapping.sources[sourceObjectIdx], [mapping.sources, sourceObjectIdx]);

   const dependency = React.useMemo<SourceObjectDependency>(
      () => sourceObject?.dependencies[dependencyIdx],
      [dependencyIdx, sourceObject?.dependencies]
   );

   const conditions = React.useMemo<BinaryExpression[]>(
      () => dependency?.conditions?.map(condition => condition.expression) ?? [],
      [dependency?.conditions]
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
      (row: SourceObjectDependencyConditionRow): SourceObjectDependencyConditionRow => {
         if (row.left.value === '' && row.right.value === '' && row.op === '=') {
            dispatch({ type: 'source-object:dependency:delete-condition', sourceObjectIdx, dependencyIdx, conditionIdx: row.idx });
         } else {
            const expression: BinaryExpression & { idx?: number } = { ...row };
            delete expression.idx;
            const condition: SourceObjectDependencyCondition = { $type: 'JoinCondition', expression };
            dispatch({
               type: 'source-object:dependency:update-condition',
               sourceObjectIdx,
               dependencyIdx,
               conditionIdx: row.idx,
               condition
            });
         }
         return row;
      },
      [dependencyIdx, dispatch, sourceObjectIdx]
   );

   const handleAddCondition = React.useCallback(
      (row: SourceObjectDependencyConditionRow): void => {
         if (row.left.value !== '' || row.right.value !== '' || row.op !== '=') {
            const condition: SourceObjectDependencyCondition = { $type: 'JoinCondition', expression: row };
            dispatch({ type: 'source-object:dependency:add-condition', sourceObjectIdx, dependencyIdx, condition });
         }
      },
      [dependencyIdx, dispatch, sourceObjectIdx]
   );

   const handleConditionUpward = React.useCallback(
      (row: SourceObjectDependencyConditionRow): void =>
         dispatch({ type: 'source-object:dependency:move-condition-up', sourceObjectIdx, dependencyIdx, conditionIdx: row.idx }),
      [dependencyIdx, dispatch, sourceObjectIdx]
   );

   const handleConditionDownward = React.useCallback(
      (row: SourceObjectDependencyConditionRow): void =>
         dispatch({ type: 'source-object:dependency:move-condition-up', sourceObjectIdx, dependencyIdx, conditionIdx: row.idx }),
      [dependencyIdx, dispatch, sourceObjectIdx]
   );

   const handleConditionDelete = React.useCallback(
      (row: SourceObjectDependencyConditionRow): void =>
         dispatch({ type: 'source-object:dependency:delete-condition', sourceObjectIdx, dependencyIdx, conditionIdx: row.idx }),
      [dependencyIdx, dispatch, sourceObjectIdx]
   );

   const columns: GridColDef<BinaryExpression>[] = React.useMemo(
      () => [
         {
            field: 'left',
            flex: 200,
            editable: true,
            renderHeader: () => 'Left',
            valueGetter: (_value, row) => row.left,
            valueFormatter: (value, row) => (row.left.$type === 'StringLiteral' ? quote(row.left.value) : row.left.value),
            renderEditCell: params => (
               <EditSourceObjectDependencyConditionComponent {...params} field='left' sourceObject={sourceObject} dependency={dependency} />
            ),
            type: 'singleSelect'
         },
         {
            field: 'op',
            flex: 50,
            editable: true,
            renderHeader: () => 'Op',
            type: 'singleSelect',
            valueOptions: ['=', '!=', '<', '<=', '>', '>=']
         },
         {
            field: 'right',
            flex: 200,
            editable: true,
            renderHeader: () => 'Right',
            valueGetter: (_value, row) => row.right,
            valueFormatter: (value, row) => (row.right.$type === 'StringLiteral' ? quote(row.right.value) : row.right.value),
            renderEditCell: params => (
               <EditSourceObjectDependencyConditionComponent
                  {...params}
                  field='right'
                  sourceObject={sourceObject}
                  dependency={dependency}
               />
            ),
            type: 'singleSelect'
         }
      ],
      [dependency, sourceObject]
   );

   const editProps =
      dependencyIdx >= 0
         ? {
              onAdd: handleAddCondition,
              onDelete: handleConditionDelete,
              onUpdate: handleConditionUpdate,
              onMoveDown: handleConditionDownward,
              onMoveUp: handleConditionUpward
           }
         : {};
   return (
      <GridComponent
         {...props}
         autoHeight
         gridColumns={columns}
         gridData={conditions}
         label={mapping.sources[sourceObjectIdx]?.dependencies[dependencyIdx]?.source}
         noEntriesText={dependencyIdx >= 0 ? 'No Conditions' : 'Please select a Source Dependency'}
         newEntryText='Add Condition'
         defaultEntry={defaultCondition}
         {...editProps}
      />
   );
}
