/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import * as React from '@theia/core/shared/react';
import { ModelContext } from '../ModelContext';
import { DataGrid, GridCellParams, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import { Attribute } from '../../../common/form-client-protocol';
import { Checkbox, FormControl, MenuItem, Select } from '@mui/material';

export function EntityAttributesTab(props: any): React.ReactElement {
    const model = React.useContext(ModelContext);

    if (model.entity === undefined) {
        return <></>;
    }

    const rows: any = [];

    // eslint-disable-next-line guard-for-in
    for (const key in model.entity.attributes) {
        if (model.entity.attributes.hasOwnProperty.call(model.entity.attributes, key)) {
            const item: Attribute = model.entity.attributes[key];

            rows.push({
                id: parseInt(key, 10),
                name: item.name,
                key: false,
                required: false,
                value: item.value,
                length: undefined,
                scale: undefined,
                precision: undefined,
                user_defined_type: undefined,
                stereotype: undefined
            });
        }
    }

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'id', width: 70 },
        { field: 'name', headerName: 'Naam', flex: 1, editable: true },
        { field: 'key', headerName: 'key', flex: 0, renderCell: CheckboxCell },
        { field: 'required', headerName: 'required', flex: 0, renderCell: CheckboxCell },
        {
            field: 'value',
            headerName: 'Data type',
            editable: true,
            flex: 1,
            minWidth: 120,
            renderCell: (params: GridCellParams) => <CustomSelect value={params.value as string} />
        },
        { field: 'length', headerName: 'length', flex: 1 },
        { field: 'scale', headerName: 'scale', flex: 1 },
        { field: 'precision', headerName: 'precision', flex: 1 },
        { field: 'user_defined_type', headerName: 'user_defined_type', flex: 1 },
        { field: 'stereotype', headerName: 'stereotype', flex: 1 }
    ];

    return (
        <div className={'form-editor-attributes-tab'}>
            <DataGrid rows={rows as GridRowsProp} columns={columns} columnBuffer={0} />
        </div>
    );
}

function CustomSelect(props: any): React.ReactElement {
    const { value, onChange } = props;

    return (
        <FormControl sx={{ minWidth: 120 }}>
            <Select labelId={'status-label'} id={'status'} value={value} label='Status' onChange={onChange}>
                <MenuItem value='Integer'>Integer</MenuItem>
                <MenuItem value='Float'>Float</MenuItem>
                <MenuItem value='Char'>Char</MenuItem>
                <MenuItem value='Varchar'>Varchar</MenuItem>
                <MenuItem value='Bool'>Bool</MenuItem>
                <MenuItem value={props.value} selected>
                    {props.value}
                </MenuItem>
            </Select>
        </FormControl>
    );
}

function CheckboxCell(params: GridCellParams): React.ReactElement {
    return <Checkbox checked={Boolean(params.value)} />;
}

// // eslint-disable-next-line @typescript-eslint/no-unused-vars
// function stringifyCircular(obj: any): string {
//     const cache: any[] = [];
//     return JSON.stringify(obj, (key, value) => {
//         if (typeof value === 'object' && value !== undefined) {
//             if (cache.includes(value)) {
//                 return;
//             }
//             cache.push(value);
//         }
//         return value;
//     });
// }
