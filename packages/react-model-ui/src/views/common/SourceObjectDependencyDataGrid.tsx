/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
   CrossReferenceContext,
   Mapping,
   ReferenceableElement,
   SourceObject,
   SourceObjectDependency,
   SourceObjectDependencyType
} from '@crossbreeze/protocol';
import { GridColDef, GridRenderEditCellParams, useGridApiContext } from '@mui/x-data-grid';
import * as React from 'react';
import { useModelDispatch, useModelQueryApi } from '../../ModelContext';
import AsyncAutoComplete from './AsyncAutoComplete';
import GridComponent, { GridComponentRow } from './GridComponent';

export interface EditSourceObjectDependencySourceComponentProps extends GridRenderEditCellParams<SourceObjectDependency> {
   sourceObject: SourceObject;
}

export function EditSourceObjectDependencySourceComponent({
   sourceObject,
   id,
   row,
   field,
   hasFocus
}: EditSourceObjectDependencySourceComponentProps): React.ReactElement {
   const queryApi = useModelQueryApi();
   const gridApi = useGridApiContext();

   const referenceCtx: CrossReferenceContext = React.useMemo(
      () => ({
         container: { globalId: sourceObject.$globalId },
         syntheticElements: [{ property: 'dependencies', type: SourceObjectDependencyType }],
         property: 'source'
      }),
      [sourceObject.$globalId]
   );
   const referenceableElements = React.useCallback(() => queryApi.findReferenceableElements(referenceCtx), [queryApi, referenceCtx]);

   const handleValueChange = React.useCallback(
      (_evt: React.SyntheticEvent, newValue: ReferenceableElement): void => {
         const source: Partial<SourceObjectDependency> = { $type: SourceObjectDependencyType, source: newValue.label };
         gridApi.current.setEditCellValue({ id, field, value: source });
      },
      [field, gridApi, id]
   );

   const value = React.useMemo<ReferenceableElement>(() => ({ uri: '', label: row.source ?? '', type: row.$type }), [row]);

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
         textFieldProps={{ sx: { margin: '0' }, autoFocus: hasFocus, placeholder: 'Select a source object' }}
         isOptionEqualToValue={(option, val) => option.label === val.label}
      />
   );
}

export type SourceObjectDependencyRow = GridComponentRow<SourceObjectDependency>;

export interface SourceObjectDependencyDataGridProps {
   mapping: Mapping;
   sourceObjectIdx: number;
}

export function SourceObjectDependencyDataGrid({ mapping, sourceObjectIdx }: SourceObjectDependencyDataGridProps): React.ReactElement {
   const dispatch = useModelDispatch();

   const sourceObject = React.useMemo<SourceObject>(() => mapping.sources[sourceObjectIdx], [mapping.sources, sourceObjectIdx]);

   const dependencies = React.useMemo<SourceObjectDependency[]>(() => sourceObject.dependencies, [sourceObject.dependencies]);

   const defaultDependency = React.useMemo<SourceObjectDependency>(
      () => ({ $type: SourceObjectDependencyType, source: '', conditions: [] }),
      []
   );

   const handleDependencyUpdate = React.useCallback(
      (row: SourceObjectDependencyRow): SourceObjectDependencyRow => {
         if (row.source === '') {
            dispatch({ type: 'source-object:delete-dependency', sourceObjectIdx, dependencyIdx: row.idx });
         } else {
            const dependency: SourceObjectDependency & { idx?: number } = { ...row };
            delete dependency.idx;
            dispatch({ type: 'source-object:update-dependency', sourceObjectIdx, dependencyIdx: row.idx, dependency });
         }
         return row;
      },
      [dispatch, sourceObjectIdx]
   );

   const handleAddDependency = React.useCallback(
      (row: SourceObjectDependencyRow): void => {
         if (row.source !== '') {
            dispatch({ type: 'source-object:add-dependency', sourceObjectIdx, dependency: row });
         }
      },
      [dispatch, sourceObjectIdx]
   );

   const handleDependencyUpward = React.useCallback(
      (row: SourceObjectDependencyRow): void =>
         dispatch({ type: 'source-object:move-dependency-up', sourceObjectIdx, dependencyIdx: row.idx }),
      [dispatch, sourceObjectIdx]
   );

   const handleDependencyDownward = React.useCallback(
      (row: SourceObjectDependencyRow): void =>
         dispatch({ type: 'source-object:move-dependency-down', sourceObjectIdx, dependencyIdx: row.idx }),
      [dispatch, sourceObjectIdx]
   );

   const handleDependencyDelete = React.useCallback(
      (row: SourceObjectDependencyRow): void =>
         dispatch({ type: 'source-object:delete-dependency', sourceObjectIdx, dependencyIdx: row.idx }),
      [dispatch, sourceObjectIdx]
   );

   const columns: GridColDef<SourceObjectDependency>[] = React.useMemo(
      () => [
         {
            field: 'source',
            flex: 100,
            editable: true,
            renderHeader: () => <>Source</>,
            valueGetter: (_value, row) => row,
            valueSetter: (value, row) => value,
            valueFormatter: (value, row) => (value as SourceObjectDependency).source,
            renderEditCell: params => <EditSourceObjectDependencySourceComponent {...params} sourceObject={sourceObject} />,
            type: 'singleSelect'
         }
      ],
      []
   );

   return (
      <GridComponent
         style={{ flexGrow: 1 }}
         autoHeight
         gridColumns={columns}
         gridData={dependencies}
         noEntriesText='No Dependencies'
         newEntryText='Add Dependency'
         defaultEntry={defaultDependency}
         onAdd={handleAddDependency}
         onDelete={handleDependencyDelete}
         onUpdate={handleDependencyUpdate}
         onMoveDown={handleDependencyDownward}
         onMoveUp={handleDependencyUpward}
      />
   );
}
