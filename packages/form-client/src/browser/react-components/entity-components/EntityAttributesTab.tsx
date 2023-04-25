/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import * as React from '@theia/core/shared/react';
import { ModelContext } from './EntityContext';
import { DataGrid, GridColDef, GridRowsProp } from '@mui/x-data-grid';
import { Attribute } from '../../../common/form-client-protocol';

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
        { field: 'id', headerName: 'id', flex: 1 },
        { field: 'name', headerName: 'Naam', flex: 1 },
        { field: 'key', headerName: 'key', flex: 1 },
        { field: 'required', headerName: 'required', flex: 1 },
        { field: 'value', headerName: 'Data type', flex: 1 },
        { field: 'length', headerName: 'length', flex: 1 },
        { field: 'scale', headerName: 'scale', flex: 1 },
        { field: 'precision', headerName: 'precision', flex: 1 },
        { field: 'user_defined_type', headerName: 'user_defined_type', flex: 1 },
        { field: 'stereotype', headerName: 'stereotype', flex: 1 }
    ];

    return (
        <div className={'form-editor-attributes-tab'}>
            <DataGrid rows={rows as GridRowsProp} columns={columns} />
        </div>
    );
}
