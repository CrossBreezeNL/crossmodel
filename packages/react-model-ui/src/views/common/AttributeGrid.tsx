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
   GridPreProcessEditCellProps,
   GridRowModes,
   GridRowModesModel,
   GridToolbarContainer,
   GridValidRowModel
} from '@mui/x-data-grid';
import * as React from 'react';

export type AttributeRow<T> = T &
   GridValidRowModel & {
      idx: number;
   };

export type ValidationFunction<T> = <P extends keyof T, V extends T[P]>(field: P, value: V) => string | undefined;

export interface AttributeGridProps<T extends GridValidRowModel> extends Omit<DataGridProps<T>, 'rows' | 'columns' | 'processRowUpdate'> {
   attributes: T[];
   attributeColumns: GridColDef<T>[];
   onNewAttribute: () => void;
   onUpdate: (toUpdate: AttributeRow<T>) => void;
   onDelete: (toDelete: AttributeRow<T>) => void;
   onMoveUp: (toMoveUp: AttributeRow<T>) => void;
   onMoveDown: (toMoveDown: AttributeRow<T>) => void;
   validateAttribute?: ValidationFunction<T>;
}

export default function AttributeGrid<T extends GridValidRowModel>({
   attributes,
   attributeColumns,
   onNewAttribute,
   onUpdate,
   onDelete,
   onMoveUp,
   onMoveDown,
   validateAttribute,
   ...props
}: AttributeGridProps<T>): React.ReactElement {
   const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});
   const [columns, setColumns] = React.useState<GridColDef<AttributeRow<T>>[]>([]);
   const [rows, setRows] = React.useState<AttributeRow<T>[]>([]);

   const validateRow = React.useCallback(
      (params: GridPreProcessEditCellProps, column: GridColDef<T>): GridEditCellProps => {
         const error = validateAttribute?.(column.field, params.props.value);
         return { ...params.props, error };
      },
      [validateAttribute]
   );

   const handleRowUpdate = React.useCallback(
      (newRow: AttributeRow<T>, oldRow: AttributeRow<T>): AttributeRow<T> => {
         const updatedRow = mergeRightToLeft(oldRow, newRow);
         onUpdate(updatedRow);
         return updatedRow;
      },
      [onUpdate]
   );

   const handleRowModesModelChange = React.useCallback((newRowModesModel: GridRowModesModel): void => {
      setRowModesModel(newRowModesModel);
   }, []);

   const getRowId = React.useCallback((attribute: AttributeRow<T>): number => attribute.idx, []);

   React.useEffect(() => {
      if (rows.length - attributes.length === -1) {
         setRowModesModel(oldModel => ({ ...oldModel, [rows.length]: { mode: GridRowModes.Edit } }));
      }
   }, [attributes.length, rows]);

   React.useEffect(() => {
      setRows(attributes.map((data, idx) => ({ ...data, idx, isNew: false })));
   }, [attributes]);

   React.useEffect(() => {
      const gridColumns = attributeColumns.map(column => ({
         preProcessEditCellProps: params => validateRow(params, column),
         ...column
      })) as GridColDef<AttributeRow<T>>[];
      gridColumns.push({
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
      setColumns(gridColumns);
   }, [attributeColumns, onDelete, onMoveDown, onMoveUp, rows.length, validateRow]);

   const EditToolbar = React.useMemo(
      () => (
         <GridToolbarContainer>
            <Button color='primary' startIcon={<AddIcon />} size='small' onClick={() => onNewAttribute()}>
               Add Attribute
            </Button>
         </GridToolbarContainer>
      ),
      [onNewAttribute]
   );

   return (
      <DataGrid<AttributeRow<T>>
         rows={rows}
         getRowId={getRowId}
         columns={columns}
         editMode='row'
         rowModesModel={rowModesModel}
         rowSelection={true}
         onRowModesModelChange={handleRowModesModelChange}
         processRowUpdate={handleRowUpdate}
         hideFooter={true}
         density='compact'
         disableColumnFilter={true}
         disableColumnSelector={true}
         disableColumnSorting={true}
         disableMultipleRowSelection={true}
         disableColumnMenu={true}
         disableDensitySelector={true}
         slots={{ toolbar: () => EditToolbar }}
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
