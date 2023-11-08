/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { EntityAttribute } from '@crossbreeze/protocol';
import { useModel, useModelDispatch } from '../../ModelContext';
import * as React from 'react';
import {
    DataGrid,
    GridActionsCellItem,
    GridCellEditStartParams,
    GridCellEditStopParams,
    GridCellModes,
    GridCellParams,
    GridColDef,
    GridRowId,
    GridRowModel,
    GridRowsProp,
    GridToolbarContainer,
    MuiEvent,
    useGridApiRef
} from '@mui/x-data-grid';
import { FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';

export function EntityAttributesDataGrid(): React.ReactElement {
    // Context variables to handle model state.
    const apiRef = useGridApiRef();
    const model = useModel();
    const dispatch = useModelDispatch();
    const [errorRow, setErrorRow] = React.useState(undefined);
    const [currentEdit, setCurrentEdit] = React.useState({} as CurrentEdit);

    // Callback for when the user stops editing a cell.
    const handleRowUpdate = (updatedRow: GridRowModel, originalRow: GridRowModel): GridRowModel => {
        if (!updatedRow.name) {
            setErrorRow(originalRow.id);
            throw new Error('Name can not be empty');
        }
        // Handle change of name property.
        dispatch({
            type: 'entity:attribute:update',
            attributeIdx: updatedRow.id,
            attribute: {
                $type: 'EntityAttribute',
                name: updatedRow.name,
                name_val: updatedRow.name_val,
                datatype: updatedRow.datatype,
                description: updatedRow.description
            }
        });

        setErrorRow(undefined);
        return updatedRow;
    };

    const handleOnCellEditStop = (params: GridCellEditStopParams, event: MuiEvent): void => {
        setErrorRow(undefined);
    };

    const handleOnCellEditStart = (params: GridCellEditStartParams, event: MuiEvent): void => {
        if (currentEdit.row_id && currentEdit.field) {
            if (apiRef.current.getCellMode(currentEdit.row_id, currentEdit.field) === GridCellModes.Edit) {
                apiRef.current.stopCellEditMode({
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

    const handleClick = (): void => {
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

    const handleUpward = (id: GridRowId) => () => {
        dispatch({
            type: 'entity:attribute:move-attribute-up',
            attributeIdx: Number(id)
        });
    };

    const handleDownward = (id: GridRowId) => () => {
        dispatch({
            type: 'entity:attribute:move-attribute-down',
            attributeIdx: Number(id)
        });
    };

    const handleDelete = (id: GridRowId) => () => {
        dispatch({
            type: 'entity:attribute:delete-attribute',
            attributeIdx: Number(id)
        });
    };

    const handleRowUpdateError = (error: Error) => () => {
        console.log(error.message);
    };

    // Check if model initalized. Has to be here otherwise the compiler complains.
    if (model.entity === undefined) {
        return <></>;
    }

    // Cols and rows for the datagrid
    const rows = createRows(model.entity.attributes);
    const columns: GridColDef[] = [
        { field: 'id', headerName: 'Index', width: 40 },
        { field: 'name_val', headerName: 'Name', editable: true, minWidth: 200 },
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
                    onClick={handleUpward(params.id)}
                    showInMenu
                />,
                <GridActionsCellItem
                    key={'Property-view-grid-Move down'}
                    icon={<ArrowDownwardIcon />}
                    label='Move down'
                    onClick={handleDownward(params.id)}
                    showInMenu
                />,
                <GridActionsCellItem
                    key={'Property-view-grid-delete'}
                    icon={<DeleteIcon />}
                    label='Delete'
                    onClick={handleDelete(params.id)}
                    showInMenu
                />
            ]
        }
    ];

    return (
        <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            // Toolbar
            slots={{ toolbar: EditToolbar }}
            slotProps={{ toolbar: { handleClick: handleClick } }}
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
            onCellEditStop={handleOnCellEditStop}
            onCellEditStart={handleOnCellEditStart}
            getRowClassName={params => (params.row.id === errorRow ? 'entity-attribute-error-row' : '')}
            apiRef={apiRef}
        />
    );
}

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

function createRows(attributes: Array<EntityAttribute>): GridRowsProp {
    const rows = attributes.map((attribute, index) => ({
        id: index,
        name: attribute.name,
        name_val: attribute.name_val,
        datatype: attribute.datatype,
        description: attribute.description
    }));

    return rows;
}

interface CurrentEdit {
    row_id?: number;
    field?: string;
}
