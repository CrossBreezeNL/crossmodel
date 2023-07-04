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
    GridToolbarContainer
} from '@mui/x-data-grid';
import { FormControl, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { ModelContext, ModelDispatchContext, ModelReducer } from '../ModelContext';
import { Accordion, AccordionDetails, AccordionSummary } from './styled-elements';
import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';

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

    // Callback for when the user selects a new datatype in the table
    function dataTypeChangedDispatch(id: number, newVal: string): void {
        dispatch({
            type: 'entity:attribute:change-datatype',
            id: id,
            dataType: newVal
        });
    }

    // Check if model initalized. Has to be here otherwise the compiler complains.
    if (model.entity === undefined) {
        return <></>;
    }

    // Cols and rows for the datagrid
    const rows = createRows(model.entity.attributes);
    const columns: GridColDef[] = [
        { field: 'id', headerName: 'id', width: 70 },
        { field: 'name', headerName: 'Naam', flex: 1, editable: true },
        {
            field: 'value',
            headerName: 'Data type',
            editable: true,
            flex: 1,
            minWidth: 120,
            renderCell: (params: GridCellParams) => <CustomSelect {...params} onChange={dataTypeChangedDispatch} />
        }
    ];

    return (
        <Accordion defaultExpanded={true}>
            <AccordionSummary aria-controls='property-entity-attributes' className='property-accordion'>
                Attributes
            </AccordionSummary>
            <AccordionDetails className='property-entity-attributes'>
                <DataGrid rows={rows} columns={columns} onCellEditStop={handleCellEdited} slots={{ toolbar: EditToolbar }} />
            </AccordionDetails>
        </Accordion>
    );
}

function EditToolbar(props: any): React.ReactElement {
    const dispatch = React.useContext(ModelDispatchContext) as React.Dispatch<React.ReducerAction<typeof ModelReducer>>;

    const handleClick = (): void => {
        dispatch({
            type: 'entity:attribute:add-empty'
        });
    };

    return (
        <GridToolbarContainer>
            <Button color='primary' startIcon={<AddIcon />} onClick={handleClick}>
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
    const rows: any = [];

    for (const key in attributes) {
        if (attributes.hasOwnProperty.call(attributes, key)) {
            const item: Attribute = attributes[key];

            rows.push({
                id: parseInt(key, 10),
                name: item.name,
                value: item.value
            });
        }
    }

    return rows;
}
