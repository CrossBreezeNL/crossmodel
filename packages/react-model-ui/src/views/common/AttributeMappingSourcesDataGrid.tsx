/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import {
   AttributeMapping,
   AttributeMappingSource,
   AttributeMappingSourceType,
   AttributeMappingType,
   CrossReferenceContext,
   ReferenceableElement,
   TargetObjectType
} from '@crossbreeze/protocol';
import { GridColDef, GridRenderEditCellParams, useGridApiContext } from '@mui/x-data-grid';
import * as React from 'react';
import { useMapping, useModelDispatch, useModelQueryApi, useReadonly } from '../../ModelContext';
import AsyncAutoComplete from './AsyncAutoComplete';
import GridComponent, { GridComponentRow } from './GridComponent';

export interface EditAttributeMappingSourceComponentProps extends GridRenderEditCellParams<AttributeMappingSource> {}

export function EditAttributeMappingSourceComponent({
   id,
   row,
   field,
   hasFocus
}: EditAttributeMappingSourceComponentProps): React.ReactElement {
   const mapping = useMapping();
   const queryApi = useModelQueryApi();
   const gridApi = useGridApiContext();
   const readonly = useReadonly();

   const referenceCtx: CrossReferenceContext = React.useMemo(
      () => ({
         container: { globalId: mapping.id },
         syntheticElements: [
            { property: 'target', type: TargetObjectType },
            { property: 'mappings', type: AttributeMappingType },
            { property: 'sources', type: AttributeMappingSourceType }
         ],
         property: 'value'
      }),
      [mapping]
   );
   const referenceableElements = React.useCallback(() => queryApi.findReferenceableElements(referenceCtx), [queryApi, referenceCtx]);

   const handleValueChange = React.useCallback(
      (_evt: React.SyntheticEvent, newValue: ReferenceableElement): void => {
         const source = { $type: AttributeMappingSourceType, value: newValue.label, uri: newValue.uri };
         gridApi.current.setEditCellValue({ id, field, value: source });
      },
      [field, gridApi, id]
   );

   const value = React.useMemo<ReferenceableElement>(() => ({ uri: '', label: row.value.toString() ?? '', type: row.$type }), [row]);

   return (
      <AsyncAutoComplete<ReferenceableElement>
         openOnFocus={true}
         fullWidth={true}
         label=''
         optionLoader={referenceableElements}
         onChange={handleValueChange}
         value={value}
         disabled={readonly}
         clearOnBlur={true}
         selectOnFocus={true}
         textFieldProps={{ sx: { margin: '0' }, autoFocus: hasFocus, placeholder: 'Select an attribute' }}
         isOptionEqualToValue={(option, val) => option.label === val.label}
      />
   );
}

export type AttributeMappingSourceRow = GridComponentRow<AttributeMappingSource>;

export interface AttributeMappingSourcesDataGridProps {
   mapping: AttributeMapping;
   mappingIdx: number;
}

export function AttributeMappingSourcesDataGrid({ mapping, mappingIdx }: AttributeMappingSourcesDataGridProps): React.ReactElement {
   const dispatch = useModelDispatch();

   const sources = React.useMemo<AttributeMappingSource[]>(() => mapping.sources, [mapping]);

   const defaultSource = React.useMemo<AttributeMappingSource>(() => ({ $type: AttributeMappingSourceType, value: '' }), []);

   // Callback for when the user stops editing a cell.
   const handleSourceUpdate = React.useCallback(
      (row: AttributeMappingSourceRow): AttributeMappingSourceRow => {
         if (row.value === '') {
            dispatch({ type: 'attribute-mapping:delete-source', mappingIdx, sourceIdx: row.idx });
         } else {
            dispatch({ type: 'attribute-mapping:update-source', mappingIdx, sourceIdx: row.idx, source: row });
         }
         return row;
      },
      [dispatch, mappingIdx]
   );

   const handleAddSource = React.useCallback(
      (row: AttributeMappingSourceRow): void => {
         if (row.value !== '') {
            dispatch({ type: 'attribute-mapping:add-source', mappingIdx, source: row });
         }
      },
      [dispatch, mappingIdx]
   );

   const handleSourceUpward = React.useCallback(
      (row: AttributeMappingSourceRow): void => dispatch({ type: 'attribute-mapping:move-source-up', mappingIdx, sourceIdx: row.idx }),
      [dispatch, mappingIdx]
   );

   const handleSourceDownward = React.useCallback(
      (row: AttributeMappingSourceRow): void => dispatch({ type: 'attribute-mapping:move-source-down', mappingIdx, sourceIdx: row.idx }),
      [dispatch, mappingIdx]
   );

   const handleSourceDelete = React.useCallback(
      (row: AttributeMappingSourceRow): void => dispatch({ type: 'attribute-mapping:delete-source', mappingIdx, sourceIdx: row.idx }),
      [dispatch, mappingIdx]
   );

   const columns: GridColDef[] = React.useMemo(
      () => [
         {
            field: 'value',
            flex: 200,
            editable: true,
            renderHeader: () => <></>,
            valueGetter: (_value, row) => row,
            valueSetter: (value, row) => value,
            valueFormatter: (value, row) => (value as AttributeMappingSource).value,
            renderEditCell: params => <EditAttributeMappingSourceComponent {...params} />,
            type: 'singleSelect'
         } as GridColDef
      ],
      []
   );

   return (
      <GridComponent
         autoHeight
         columnHeaderHeight={0}
         gridColumns={columns}
         gridData={sources}
         noEntriesText='No Sources'
         newEntryText='Add Source'
         defaultEntry={defaultSource}
         onAdd={handleAddSource}
         onDelete={handleSourceDelete}
         onUpdate={handleSourceUpdate}
         onMoveDown={handleSourceDownward}
         onMoveUp={handleSourceUpward}
      />
   );
}
