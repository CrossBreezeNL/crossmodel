/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/

import { CrossReferenceContext, DataModelDependency, DataModelDependencyType } from '@crossmodel/protocol';
import { GridColDef, GridRenderEditCellParams, useGridApiContext } from '@mui/x-data-grid';
import * as React from 'react';
import { useDataModel, useModelDispatch, useModelQueryApi, useReadonly } from '../../ModelContext';
import AsyncAutoComplete from './AsyncAutoComplete';
import GridComponent, { GridComponentRow } from './GridComponent';

export type DataModelDependencyRow = GridComponentRow<DataModelDependency>;

interface DataModelEditCellProps extends GridRenderEditCellParams {}

function DataModelDependencyEditCell({ id, value, field, hasFocus }: DataModelEditCellProps): React.ReactElement {
   const dataModel = useDataModel();
   const queryApi = useModelQueryApi();
   const gridApi = useGridApiContext();
   const readonly = useReadonly();

   const referenceCtx: CrossReferenceContext = React.useMemo(
      () => ({
         container: { globalId: dataModel!.id! },
         syntheticElements: [{ property: 'dependencies', type: DataModelDependencyType }],
         property: 'datamodel'
      }),
      [dataModel]
   );

   const referenceableElements = React.useCallback(
      () => queryApi.findReferenceableElements(referenceCtx).then(elements => elements.map(element => element.label)),
      [queryApi, referenceCtx]
   );

   const handleValueChange = React.useCallback(
      (newValue: string): void => {
         gridApi.current.setEditCellValue({ id, field, value: newValue });
      },
      [field, gridApi, id]
   );

   const handleOptionsLoaded = React.useCallback(
      (options: string[]) => {
         if (options.length && !value) {
            gridApi.current.setEditCellValue({ id, field, value: options[0] });
         }
      },
      [value, field, gridApi, id]
   );

   return (
      <AsyncAutoComplete
         autoFocus={hasFocus}
         fullWidth={true}
         label=''
         optionLoader={referenceableElements}
         onOptionsLoaded={handleOptionsLoaded}
         onChange={(_evt, newReference) => handleValueChange(newReference)}
         value={value ?? ''}
         clearOnBlur={true}
         selectOnFocus={true}
         disabled={readonly}
         textFieldProps={{ sx: { margin: '0' } }}
      />
   );
}

export function DataModelDependenciesDataGrid(): React.ReactElement {
   const dataModel = useDataModel();
   const dispatch = useModelDispatch();
   const readonly = useReadonly();

   const dependencies = React.useMemo(() => dataModel?.dependencies ?? [], [dataModel?.dependencies]);

   const handleRowUpdate = React.useCallback(
      (dependency: DataModelDependencyRow): DataModelDependencyRow => {
         dispatch({
            type: 'datamodel:dependency:update',
            dependencyIdx: dependency.idx,
            dependency: GridComponentRow.getData(dependency)
         });
         return dependency;
      },
      [dispatch]
   );

   const handleAddDependency = React.useCallback(
      (dependency: DataModelDependencyRow): void => {
         // The datamodel field in the row is a string (due to valueGetter/valueSetter)
         if (dependency.datamodel) {
            const dependencyData: DataModelDependency = {
               $type: DataModelDependencyType,
               datamodel: dependency.datamodel as string,
               version: dependency.version || ''
            };
            dispatch({
               type: 'datamodel:dependency:add-dependency',
               dependency: dependencyData
            });
         }
      },
      [dispatch]
   );

   const handleDependencyUpward = React.useCallback(
      (dependency: DataModelDependencyRow): void => {
         dispatch({
            type: 'datamodel:dependency:move-dependency-up',
            dependencyIdx: dependency.idx
         });
      },
      [dispatch]
   );

   const handleDependencyDownward = React.useCallback(
      (dependency: DataModelDependencyRow): void => {
         dispatch({
            type: 'datamodel:dependency:move-dependency-down',
            dependencyIdx: dependency.idx
         });
      },
      [dispatch]
   );

   const handleDependencyDelete = React.useCallback(
      (dependency: DataModelDependencyRow): void => {
         dispatch({
            type: 'datamodel:dependency:delete-dependency',
            dependencyIdx: dependency.idx
         });
      },
      [dispatch]
   );

   const columns = React.useMemo<GridColDef[]>(
      () => [
         {
            field: 'datamodel',
            headerName: 'Data Model',
            flex: 200,
            editable: !readonly,
            renderEditCell: params => <DataModelDependencyEditCell {...params} />,
            valueGetter: (value: any) => value || '',
            valueSetter: (value, row) => ({
               ...row,
               datamodel: value
            })
         },
         {
            field: 'version',
            headerName: 'Version',
            flex: 100,
            editable: !readonly,
            type: 'string'
         }
      ],
      [readonly]
   );

   const defaultEntry = React.useMemo(
      (): DataModelDependency => ({
         $type: DataModelDependencyType,
         datamodel: '',
         version: ''
      }),
      []
   );

   if (!dataModel) {
      return <div>No Data Model!</div>;
   }

   return (
      <GridComponent
         key={dataModel.id + '-dependencies-grid'}
         gridColumns={columns}
         gridData={dependencies}
         defaultEntry={defaultEntry}
         onDelete={handleDependencyDelete}
         onMoveDown={handleDependencyDownward}
         onMoveUp={handleDependencyUpward}
         noEntriesText='No Dependencies'
         newEntryText='Add Dependency'
         onAdd={handleAddDependency}
         onUpdate={handleRowUpdate}
      />
   );
}
