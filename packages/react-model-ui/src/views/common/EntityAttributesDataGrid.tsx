/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { EntityAttribute } from '@crossbreeze/protocol';
import AddIcon from '@mui/icons-material/Add';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, FormControl, MenuItem, Select, SelectChangeEvent, Tooltip, TooltipProps, styled, tooltipClasses } from '@mui/material';
import Button from '@mui/material/Button';
import {
   DataGrid,
   GridActionsCellItem,
   GridCellEditStartParams,
   GridCellModes,
   GridCellParams,
   GridColDef,
   GridEditCellProps,
   GridEditInputCell,
   GridPreProcessEditCellProps,
   GridRenderEditCellParams,
   GridRowId,
   GridRowModel,
   GridRowsProp,
   GridToolbarContainer,
   MuiEvent,
   useGridApiRef
} from '@mui/x-data-grid';
import * as React from 'react';
import { useModel, useModelDispatch } from '../../ModelContext';

export function EntityAttributesDataGrid(): React.ReactElement {
   // Context variables to handle model state.
   const model = useModel();
   const gridApiRef = useGridApiRef();
   const dispatch = useModelDispatch();
   const [currentEdit, setCurrentEdit] = React.useState({} as CurrentEdit);

   // Callback for when the user stops editing a cell.
   const handleRowUpdate = (updatedRow: GridRowModel, originalRow: GridRowModel): GridRowModel => {
      // Handle change of name property.
      dispatch({
         type: 'entity:attribute:update',
         attributeIdx: updatedRow.id,
         attribute: {
            $type: 'EntityAttribute',
            id: updatedRow.attributeId,
            name: updatedRow.name,
            datatype: updatedRow.datatype,
            description: updatedRow.description
         }
      });
      return updatedRow;
   };

   // Cell edit handler to block editing of any other row, when a row is erroneous.
   const handleOnCellEditStart = (params: GridCellEditStartParams, event: MuiEvent): void => {
      if (currentEdit.row_id && currentEdit.field) {
         if (gridApiRef.current.getCellMode(currentEdit.row_id, currentEdit.field) === GridCellModes.Edit) {
            gridApiRef.current.stopCellEditMode({
               id: currentEdit.row_id,
               field: currentEdit.field,
               ignoreModifications: true // will also discard the changes made
            });
         }
      }

      setCurrentEdit({
         row_id: params.id as number,
         field: params.field
      });
   };

   const handleAddAttribute = (): void => {
      dispatch({
         type: 'entity:attribute:add-empty'
      });
   };

   // Callback for when the user selects a new datatype in the table
   function dataTypeChangedDispatch(id: number, newVal: string): void {
      dispatch({
         type: 'entity:attribute:change-datatype',
         attributeIdx: id,
         datatype: newVal
      });
   }

   const handleAttributeUpward = (id: GridRowId) => () => {
      dispatch({
         type: 'entity:attribute:move-attribute-up',
         attributeIdx: Number(id)
      });
   };

   const handleAttributeDownward = (id: GridRowId) => () => {
      dispatch({
         type: 'entity:attribute:move-attribute-down',
         attributeIdx: Number(id)
      });
   };

   const handleAttributeDelete = (id: GridRowId) => () => {
      dispatch({
         type: 'entity:attribute:delete-attribute',
         attributeIdx: Number(id)
      });
   };

   const handleRowUpdateError = (error: Error) => () => {
      console.log(error.message);
   };

   // Check if model initialized. Has to be here otherwise the compiler complains.
   if (model.entity === undefined) {
      return <></>;
   }

   // Pre-process function for mandatory cells. This will show an error message on the cell of the field is empty.
   const preProcessMandatoryCellProps = (params: GridPreProcessEditCellProps): GridEditCellProps => {
      const error = params.props.value!.toString().length === 0;
      const errormessage = error ? 'This field is mandatory!' : undefined;
      return { ...params.props, error: error, errormessage: errormessage };
   };

   // Cols and rows for the data grid
   const rows = createRows(model.entity.attributes);
   const columns: GridColDef[] = [
      // { field: 'id', headerName: 'Id', width: 40 },
      {
         field: 'name',
         headerName: 'Name',
         minWidth: 200,
         editable: true,
         preProcessEditCellProps: preProcessMandatoryCellProps,
         renderEditCell: renderValidateableCell
      },
      {
         field: 'datatype',
         headerName: 'Data type',
         minWidth: 120,
         renderCell: (params: GridCellParams) => <DataTypeSelect {...params} onChange={dataTypeChangedDispatch} />
      },
      { field: 'description', headerName: 'Description', editable: true, minWidth: 200 },
      {
         field: 'actions',
         type: 'actions',
         width: 80,
         getActions: params => [
            <GridActionsCellItem
               key={'Property-view-grid-Move up'}
               icon={<ArrowUpwardIcon />}
               label='Move up'
               onClick={handleAttributeUpward(params.id)}
               showInMenu
            />,
            <GridActionsCellItem
               key={'Property-view-grid-Move down'}
               icon={<ArrowDownwardIcon />}
               label='Move down'
               onClick={handleAttributeDownward(params.id)}
               showInMenu
            />,
            <GridActionsCellItem
               key={'Property-view-grid-delete'}
               icon={<DeleteIcon />}
               label='Delete'
               onClick={handleAttributeDelete(params.id)}
               showInMenu
            />
         ]
      }
   ];

   return (
      <DataGrid
         autoHeight
         columns={columns}
         rows={rows}
         // Toolbar
         slots={{ toolbar: EditToolbar }}
         slotProps={{ toolbar: { handleClick: handleAddAttribute } }}
         // page sizes
         pageSizeOptions={[8, 16, 24]}
         initialState={{
            pagination: { paginationModel: { pageSize: 8 } },
            columns: {
               columnVisibilityModel: {
                  id: false
               }
            }
         }}
         processRowUpdate={handleRowUpdate}
         onProcessRowUpdateError={handleRowUpdateError}
         // Enable cell edit stop and start handlers to revert cell-changes for erroneous cells when starting editing another cell.
         onCellEditStart={handleOnCellEditStart}
         apiRef={gridApiRef}
      />
   );
}

// Style tooltip element, to show the error message of a validation.
const StyledTooltip = styled(({ className, ...props }: TooltipProps) => <Tooltip {...props} classes={{ popper: className }} />)(
   ({ theme }) => ({
      [`& .${tooltipClasses.tooltip}`]: {
         backgroundColor: theme.palette.error.main,
         color: theme.palette.error.contrastText
      }
   })
);

// Custom edit cell element, which can show an error in a tooltip.
function ValidateableEditInputCell(props: GridRenderEditCellParams): React.JSX.Element {
   return (
      <div>
         <div>
            <GridEditInputCell {...props} />
         </div>
         <Box sx={{ width: '100%' }}>
            <StyledTooltip open={!!props.error} title={props.errormessage || ''} arrow>
               <div></div>
            </StyledTooltip>
         </Box>
      </div>
   );
}

// Render function for rendering the validateable cell.
function renderValidateableCell(params: GridRenderEditCellParams): React.JSX.Element {
   return <ValidateableEditInputCell {...params} />;
}

// Edit toolbar with the button to add an attribute.
function EditToolbar(props: any): React.ReactElement {
   return (
      <GridToolbarContainer>
         <Button color='primary' startIcon={<AddIcon />} onClick={props.handleClick}>
            Add attribute
         </Button>
      </GridToolbarContainer>
   );
}

// Data Type selection (drop-down) element.
function DataTypeSelect(props: any): React.ReactElement {
   const { id, value, onChange } = props;
   const options = ['Integer', 'Float', 'Char', 'Varchar', 'Bool'];

   // When the custom value does not exist yet in the options, we add it to the list
   if (props.datatype !== undefined && options.findIndex((item: string) => item.toLowerCase() === props.datatype.toLowerCase()) === -1) {
      options.push(props.datatype);
   }

   return (
      <FormControl sx={{ minWidth: 120, width: '100%' }}>
         <Select
            sx={{ width: '100%' }}
            value={value}
            onChange={(event: SelectChangeEvent<any>) => {
               onChange(id, event.target.value);
            }}
         >
            {options.map((option: string) => (
               <MenuItem key={option} value={option}>
                  {option}
               </MenuItem>
            ))}
         </Select>
      </FormControl>
   );
}

// Function to construct an error of rows.
function createRows(attributes: Array<EntityAttribute>): GridRowsProp {
   const rows = attributes.map((attribute, index) => ({
      id: index,
      attributeId: attribute.id,
      name: attribute.name,
      datatype: attribute.datatype,
      description: attribute.description
   }));

   return rows;
}

// Interface for storing the currently being edited row and field.
interface CurrentEdit {
   row_id?: number;
   field?: string;
}
