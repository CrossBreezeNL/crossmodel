/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { DeleteOutlined } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { Box, Button, Stack, Typography } from '@mui/material';
import { popoverClasses } from '@mui/material/Popover';
import {
   DataGrid,
   DataGridProps,
   GridActionsCellItem,
   GridColDef,
   GridEditCellProps,
   GridOverlay,
   GridPreProcessEditCellProps,
   GridRowEditStartParams,
   GridRowEditStopParams,
   GridRowModes,
   GridRowModesModel,
   GridValidRowModel,
   useGridApiRef
} from '@mui/x-data-grid';
import * as React from 'react';
import { useReadonly } from '../../ModelContext';

export type GridComponentRow<T> = T &
   GridValidRowModel & {
      idx: number;
   };

export namespace GridComponentRow {
   export function getData<T>(row: GridComponentRow<T>): T {
      // we just remove the artificially created index or any other fields we might have added
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { idx, _action, ...data } = row;
      return data as T;
   }
}

export type ValidationFunction<T> = <P extends keyof T, V extends T[P]>(field: P, value: V) => string | undefined;

export interface GridComponentProps<T extends GridValidRowModel> extends Omit<DataGridProps<T>, 'rows' | 'columns' | 'processRowUpdate'> {
   gridData: T[];
   gridColumns: GridColDef<T>[];
   defaultEntry: T;
   label?: string;
   noEntriesText?: string;
   newEntryText?: string;
   onAdd?: (toAdd: GridComponentRow<T>) => void | GridComponentRow<T> | Promise<void | GridComponentRow<T>>;
   onUpdate?: (toUpdate: GridComponentRow<T>) => void | GridComponentRow<T> | Promise<void | GridComponentRow<T>>;
   onDelete?: (toDelete: GridComponentRow<T>) => void;
   onMoveUp?: (toMoveUp: GridComponentRow<T>) => void;
   onMoveDown?: (toMoveDown: GridComponentRow<T>) => void;
   validateField?: ValidationFunction<T>;
}

export function isChildOf(child: Element, predicate: (parent: Element) => boolean): boolean {
   let currentElement: Element | null = child;
   while (currentElement && !predicate(currentElement)) {
      currentElement = currentElement.parentElement;
   }
   return !!currentElement;
}

export default function GridComponent<T extends GridValidRowModel>({
   gridData,
   gridColumns,
   defaultEntry,
   label,
   noEntriesText,
   newEntryText,
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
   const editedRow = React.useRef<number | string>();
   const gridRef = React.useRef<HTMLDivElement>(null); // eslint-disable-line no-null/no-null
   const gridApi = useGridApiRef();
   const readonly = useReadonly();

   React.useEffect(() => {
      // The grid will only handle focus changes if focus moves inside the form or there is a click on another React component.
      // This ensures that changes of focus to non-React elements are handled as well.
      const handleFocusChange = (e: FocusEvent): void => {
         if (
            !(e.target instanceof Element) ||
            gridRef.current?.contains(e.target) ||
            editedRow.current === undefined ||
            isChildOf(e.target, parent => parent.classList.contains(popoverClasses.root)) // skip popover children to support select list
         ) {
            return;
         }
         gridApi.current?.stopRowEditMode({ id: editedRow.current });
         editedRow.current = undefined;
      };
      document.addEventListener('focusin', handleFocusChange);
      return () => document.removeEventListener('focusin', handleFocusChange);
   }, [gridApi]);

   const handleRowEditStart = React.useCallback((params: GridRowEditStartParams): void => {
      editedRow.current = params.id;
   }, []);

   const validateRow = React.useCallback(
      (params: GridPreProcessEditCellProps, column: GridColDef<T>): GridEditCellProps => {
         const error = validateField?.(column.field, params.props.value);
         return { ...params.props, error };
      },
      [validateField]
   );

   const removeSyntheticRows = React.useCallback(() => {
      if (rows.find(row => row.idx < 0)) {
         setRows(oldRows => oldRows.filter(row => row.idx >= 0));
      }
      if (Object.keys(rowModesModel).find(rowId => Number(rowId) < 0)) {
         setRowModesModel(oldModel => Object.fromEntries(Object.entries(oldModel).filter(([idx]) => Number(idx) >= 0)));
      }
   }, [rowModesModel, rows]);

   const handleRowUpdate = React.useCallback(
      async (newRow: GridComponentRow<T>, oldRow: GridComponentRow<T>): Promise<GridComponentRow<T>> => {
         editedRow.current = undefined;
         const defaultRow: GridComponentRow<T> = { ...defaultEntry, idx: -1 };
         const updatedRow = mergeRightToLeft(defaultRow, oldRow, newRow);
         if (updatedRow.idx === undefined || updatedRow.idx < 0) {
            removeSyntheticRows();
            await onAdd?.(updatedRow);
            return { ...updatedRow, idx: -1, _action: 'delete' };
         } else if (updatedRow.idx >= 0) {
            await onUpdate?.(updatedRow);
         }
         return updatedRow;
      },
      [defaultEntry, onAdd, onUpdate, removeSyntheticRows]
   );

   const handleRowUpdateError = React.useCallback(async (error: any): Promise<void> => console.log(error), []);

   const handleRowModesModelChange = React.useCallback((newRowModesModel: GridRowModesModel): void => {
      setRowModesModel(newRowModesModel);
   }, []);

   const handleRowEditStop = React.useCallback(
      (params: GridRowEditStopParams<T>): void => {
         removeSyntheticRows();
         editedRow.current = undefined;
      },
      [removeSyntheticRows]
   );

   const createSyntheticRow = React.useCallback(() => {
      const id = -1;
      if (!rows.find(row => row.idx === id)) {
         const syntheticRow = { ...defaultEntry, idx: id };
         let _$type = syntheticRow.$type;
         Object.defineProperty(syntheticRow, '$type', {
            get() {
               return _$type;
            },
            set(newValue) {
               console.log(`$type is changing to ${newValue}`);
               // eslint-disable-next-line no-debugger
               debugger; // Pauses execution here
               _$type = newValue;
            },
            configurable: true,
            enumerable: true
         });
         setRows(oldRows => [...oldRows, syntheticRow]);
      }

      // put new row in edit mode
      const fieldToFocus = columns.length > 0 ? columns[0].field : undefined;
      setRowModesModel(oldModel => ({ ...oldModel, [id]: { mode: GridRowModes.Edit, fieldToFocus } }));
      editedRow.current = id;
   }, [columns, defaultEntry, rows]);

   const deleteEntry = React.useCallback(
      (row: GridComponentRow<T>) => {
         if (row.idx < 0) {
            removeSyntheticRows();
         } else {
            onDelete?.(row);
         }
      },
      [onDelete, removeSyntheticRows]
   );

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
               onClick={() => deleteEntry(params.row)}
               color='inherit'
               disabled={deleteEntry === undefined || readonly}
            />,
            <GridActionsCellItem
               key='move-up'
               icon={<ArrowUpwardIcon />}
               label='Move Up'
               onClick={() => onMoveUp?.(params.row)}
               color='inherit'
               disabled={onMoveUp === undefined || params.row.idx === 0 || readonly}
            />,
            <GridActionsCellItem
               key='move-down'
               icon={<ArrowDownwardIcon />}
               label='Move Down'
               onClick={() => onMoveDown?.(params.row)}
               color='inherit'
               disabled={onMoveDown === undefined || params.row.idx === rows.length - 1 || readonly}
            />
         ]
      });
      setColumns(allColumns);
   }, [gridColumns, deleteEntry, onMoveDown, onMoveUp, rows.length, validateRow, readonly]);

   function EditToolbar(): React.ReactElement {
      return (
         <Stack direction='row' spacing={1} sx={{ mb: 1 }}>
            <Button
               color='primary'
               startIcon={<AddIcon />}
               size='small'
               onClick={() => createSyntheticRow()}
               disabled={onAdd === undefined || readonly}
            >
               {newEntryText ?? 'Add'}
            </Button>
            {label ? (
               <>
                  <Box sx={{ flexGrow: 1 }} />
                  <Typography variant='overline' sx={{ paddingX: '5px', color: '#007acc' }}>
                     {label}
                  </Typography>
               </>
            ) : (
               <></>
            )}
         </Stack>
      );
   }

   const NoRowsOverlay = React.useMemo(() => <GridOverlay>{noEntriesText ?? 'No Entries'}</GridOverlay>, [noEntriesText]);

   return (
      <Box sx={{ width: '100%' }}>
         <EditToolbar />
         <div style={{ display: 'flex', flexDirection: 'column' }}>
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
               onProcessRowUpdateError={handleRowUpdateError}
               hideFooter={true}
               density='compact'
               disableColumnFilter={true}
               disableColumnSelector={true}
               disableColumnSorting={true}
               disableMultipleRowSelection={true}
               disableColumnMenu={true}
               disableDensitySelector={true}
               onRowEditStart={handleRowEditStart}
               apiRef={gridApi}
               ref={gridRef}
               slots={{ noRowsOverlay: () => NoRowsOverlay }}
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
                  },
                  '& .MuiDataGrid-columnHeader': {
                     textTransform: 'uppercase',
                     fontSize: '0.75em',
                     letterSpacing: '0.1em'
                  }
               }}
               {...props}
            />
         </div>
      </Box>
   );
}

function mergeRightToLeft<T extends Record<string, any>>(one: T, ...more: T[]): T {
   let result = { ...one };
   more
      // eslint-disable-next-line no-null/no-null
      .filter(entry => entry !== undefined && entry !== null)
      .forEach(
         right => (result = Object.entries(right).reduce((acc, [key, value]) => ({ ...acc, [key]: value ?? acc[key] }), { ...result }))
      );
   return result;
}
