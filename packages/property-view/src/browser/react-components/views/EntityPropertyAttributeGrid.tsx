/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { CrossModelRoot, Attribute } from '@crossbreeze/model-service';
import * as React from '@theia/core/shared/react';
import {
    DataGrid,
    GridCellParams,
    GridColDef,
    GridRowsProp,
    GridCellEditStopParams,
    GridEventListener,
    MuiEvent,
    MuiBaseEvent,
    GridToolbarContainer,
    GridActionsCellItem,
    GridRowId
} from '@mui/x-data-grid';
import { FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { ModelContext, ModelDispatchContext, ModelReducer } from '../ModelContext';
import { Accordion, AccordionDetails, AccordionSummary } from './styled-elements';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import Button from '@mui/material/Button';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export function EntityPropertyAttributes(): React.ReactElement {
    // Context variables to handle model state.
    const model = React.useContext(ModelContext) as CrossModelRoot;
    const dispatch = React.useContext(ModelDispatchContext) as React.Dispatch<React.ReducerAction<typeof ModelReducer>>;

    // Callback for when the user stops editing a cell.
    const handleCellEdited: GridEventListener<'cellEditStop'> = (params: GridCellEditStopParams, event: MuiEvent<MuiBaseEvent>) => {
        // Have to cast it to React.ChangeEvent<HTMLInputElement>, otherwise the compiler does not stop complaining about types.
        const reactEvent = event as React.ChangeEvent<HTMLInputElement>;

        if (params.field === 'name') {
            dispatch({
                type: 'entity:attribute:change-name',
                id: params.id,
                name: reactEvent.target.value ? reactEvent.target.value : ''
            });
        }
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
            id: id,
            dataType: newVal
        });
    }

    const handleUpward = (id: GridRowId) => () => {
        dispatch({
            type: 'entity:attribute:move-attribute-up',
            id: id
        });
    };

    const handleDownward = (id: GridRowId) => () => {
        dispatch({
            type: 'entity:attribute:move-attribute-down',
            id: id
        });
    };

    const handleDelete = (id: GridRowId) => () => {
        dispatch({
            type: 'entity:attribute:delete-attribute',
            id: id
        });
    };

    // Check if model initalized. Has to be here otherwise the compiler complains.
    if (model.entity === undefined) {
        return <></>;
    }

    // Cols and rows for the datagrid
    const rows = createRows(model.entity.attributes);
    const columns: GridColDef[] = [
        { field: 'id', headerName: 'id', width: 40 },
        { field: 'name', headerName: 'Naam', editable: true, minWidth: 200 },
        {
            field: 'value',
            headerName: 'Data type',
            editable: true,
            minWidth: 120,
            renderCell: (params: GridCellParams) => <CustomSelect {...params} onChange={dataTypeChangedDispatch} />
        },
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
        <Accordion defaultExpanded={true}>
            <AccordionSummary aria-controls='property-entity-attributes' className='property-accordion'>
                Attributes
            </AccordionSummary>
            <AccordionDetails className='property-entity-attributes'>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    onCellEditStop={handleCellEdited}
                    // Toolbar
                    slots={{ toolbar: EditToolbar }}
                    slotProps={{ toolbar: { handleClick: handleClick } }}
                    // page sizes
                    pageSizeOptions={[8, 16, 24]}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 8 } }
                    }}
                />
            </AccordionDetails>
        </Accordion>
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

function CustomSelect(props: any): React.ReactElement {
    const { id, value, onChange } = props;
    const options = ['Integer', 'Float', 'Char', 'Varchar', 'Bool'];

    // When the custom value does not exist yet in the options, we add it to the list
    if (options.findIndex((item: string) => item.toLowerCase() === props.value.toLowerCase()) === -1) {
        options.push(props.value);
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

function createRows(attributes: Array<Attribute>): GridRowsProp {
    const rows = attributes.map((attribute, index) => ({
        id: index,
        name: attribute.name,
        value: attribute.value
    }));

    return rows;
}