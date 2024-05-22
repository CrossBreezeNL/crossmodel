/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { DeleteOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import Button from '@mui/material/Button';
import {
   DataGrid,
   DataGridProps,
   GridActionsCellItem,
   GridColDef,
   GridEditCellProps,
   GridOverlay,
   GridPreProcessEditCellProps,
   GridRowEditStopParams,
   GridRowModes,
   GridRowModesModel,
   GridToolbarContainer,
   GridValidRowModel
} from '@mui/x-data-grid';
import * as React from 'react';

export type GridComponentRow<T> = T &
   GridValidRowModel & {
      idx: number;
   };

export type ValidationFunction<T> = <P extends keyof T, V extends T[P]>(field: P, value: V) => string | undefined;

export interface GridComponentProps<T extends GridValidRowModel> extends Omit<DataGridProps<T>, 'rows' | 'columns' | 'processRowUpdate'> {
   gridData: T[];
   gridColumns: GridColDef<T>[];
   noEntriesText?: string;
   newEntryText: string;
   defaultEntry: T;
   onAdd: (toAdd: GridComponentRow<T>) => void | GridComponentRow<T> | Promise<void | GridComponentRow<T>>;
   onUpdate: (toUpdate: GridComponentRow<T>) => void | GridComponentRow<T> | Promise<void | GridComponentRow<T>>;
   onDelete: (toDelete: GridComponentRow<T>) => void;
   onMoveUp: (toMoveUp: GridComponentRow<T>) => void;
   onMoveDown: (toMoveDown: GridComponentRow<T>) => void;
   validateField?: ValidationFunction<T>;
}

export default function GridComponent<T extends GridValidRowModel>({
   gridData,
   gridColumns,
   noEntriesText,
   newEntryText,
   defaultEntry,
   onAdd,
   onUpdate,
   onDelete,
   onMoveUp,
   onMoveDown,
   validateField,
   ...props
}: GridComponentProps<T>): React.ReactElement {
   const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});
   const [columns, setColumns] = React.useState<GridColDef<GridComponentRow<T>>[]>([]);
   const [rows, setRows] = React.useState<GridComponentRow<T>[]>([]);

   const validateRow = React.useCallback(
      (params: GridPreProcessEditCellProps, column: GridColDef<T>): GridEditCellProps => {
         const error = validateField?.(column.field, params.props.value);
         return { ...params.props, error };
      },
      [validateField]
   );

   const handleRowUpdate = React.useCallback(
      async (newRow: GridComponentRow<T>, oldRow: GridComponentRow<T>): Promise<GridComponentRow<T>> => {
         const updatedRow = mergeRightToLeft(oldRow, newRow);
         if (updatedRow.idx === undefined || updatedRow.idx < 0) {
            await onAdd(updatedRow);
            setRows(oldRows => oldRows.filter(row => row.idx !== updatedRow.idx));
            return { ...updatedRow, _action: 'delete' };
         } else if (updatedRow.idx >= 0) {
            await onUpdate(updatedRow);
         }
         return updatedRow;
      },
      [onAdd, onUpdate]
   );

   const handleRowModesModelChange = React.useCallback((newRowModesModel: GridRowModesModel): void => {
      setRowModesModel(newRowModesModel);
   }, []);

   const handleRowEditStop = React.useCallback((params: GridRowEditStopParams<T>): void => {
      if (params.row.idx < 0) {
         setRows(oldRows => oldRows.filter(row => row.idx >= 0));
         setRowModesModel(oldModel => {
            const newModel = { ...oldModel };
            delete newModel[params.row.idx];
            return newModel;
         });
      }
   }, []);

   const getRowId = React.useCallback((row: GridComponentRow<T>): number => row.idx, []);

   React.useEffect(() => {
      setRows(gridData.map((data, idx) => ({ ...data, idx })));
   }, [gridData]);

   React.useEffect(() => {
      const allColumns = gridColumns.map(column => ({
         preProcessEditCellProps: params => validateRow(params, column),
         ...column
      })) as GridColDef<GridComponentRow<T>>[];
      allColumns.push({
         field: 'actions',
         type: 'actions',
         cellClassName: 'actions',
         getActions: params => [
            <GridActionsCellItem
               key='delete'
               icon={<DeleteOutlined />}
               label='Delete'
               onClick={() => onDelete(params.row)}
               color='inherit'
            />,
            <GridActionsCellItem
               key='move-up'
               icon={<ArrowUpwardIcon />}
               label='Move Up'
               onClick={() => onMoveUp(params.row)}
               color='inherit'
               disabled={params.row.idx === 0}
            />,
            <GridActionsCellItem
               key='move-down'
               icon={<ArrowDownwardIcon />}
               label='Move Down'
               onClick={() => onMoveDown(params.row)}
               color='inherit'
               disabled={params.row.idx === rows.length - 1}
            />
         ]
      });
      setColumns(allColumns);
   }, [gridColumns, onDelete, onMoveDown, onMoveUp, rows.length, validateRow]);

   const createNewEntry = React.useCallback(() => {
      const id = -1;
      if (!rows.find(row => row.idx === -1)) {
         setRows(oldRows => [...oldRows, { ...defaultEntry, idx: id }]);
      }

      // put new row in edit mode
      const fieldToFocus = columns.length > 0 ? columns[0].field : undefined;
      setRowModesModel(oldModel => ({ ...oldModel, [id]: { mode: GridRowModes.Edit, fieldToFocus } }));
   }, [columns, defaultEntry, rows]);

   const EditToolbar = React.useMemo(
      () => (
         <GridToolbarContainer>
            <Button color='primary' startIcon={<AddIcon />} size='small' onClick={() => createNewEntry()}>
               {newEntryText}
            </Button>
         </GridToolbarContainer>
      ),
      [createNewEntry, newEntryText]
   );

   const NoRowsOverlay = React.useMemo(() => <GridOverlay>{noEntriesText ?? 'No Rows'}</GridOverlay>, [noEntriesText]);

   return (
      <DataGrid<GridComponentRow<T>>
         rows={rows}
         getRowId={getRowId}
         columns={columns}
         editMode='row'
         rowModesModel={rowModesModel}
         rowSelection={true}
         onRowModesModelChange={handleRowModesModelChange}
         onRowEditStop={handleRowEditStop}
         processRowUpdate={handleRowUpdate}
         hideFooter={true}
         density='compact'
         disableColumnFilter={true}
         disableColumnSelector={true}
         disableColumnSorting={true}
         disableMultipleRowSelection={true}
         disableColumnMenu={true}
         disableDensitySelector={true}
         slots={{ toolbar: () => EditToolbar, noRowsOverlay: () => NoRowsOverlay }}
         sx={{
            fontSize: '1em',
            width: '100%',
            '&.MuiDataGrid-root': {
               width: '100%'
            },
            '& .actions': {
               color: 'text.secondary'
            },
            '& .textPrimary': {
               color: 'text.primary'
            },
            '& :focus': {
               outline: 'none !important'
            },
            '& .MuiOutlinedInput-notchedOutline': {
               borderWidth: 0
            },
            '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
               borderWidth: '0 !important'
            },
            '& .MuiDataGrid-row--editing .MuiDataGrid-cell': {
               backgroundColor: 'transparent !important'
            },
            '& .MuiInputBase-input': {
               padding: '0 9px',
               fontSize: '13px'
            },
            '& .MuiAutocomplete-input, & .MuiAutocomplete-input': {
               padding: '2px 3px !important',
               fontSize: '13px'
            },
            '& .MuiSelect-select': {
               paddingTop: '1px'
            },
            '& .Mui-error': {
               backgroundColor: 'var(--theia-inputValidation-errorBackground)',
               color: 'var(--theia-inputValidation-errorBorder)'
            }
         }}
         {...props}
      />
   );
}

function mergeRightToLeft<T extends Record<string, any>>(one: T, ...more: T[]): T {
   let result = { ...one };
   more.forEach(
      right => (result = Object.entries(right).reduce((acc, [key, value]) => ({ ...acc, [key]: value ?? acc[key] }), { ...result }))
   );
   return result;
}
