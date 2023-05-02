/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as React from '@theia/core/shared/react';
import { CrossModelRoot } from '../../common/form-client-protocol';

export const ModelContext = React.createContext({} as CrossModelRoot);
export const ModelDispatchContext = React.createContext({});

export function ModelReducer(model: CrossModelRoot, action: any): CrossModelRoot {
    if (model.entity === undefined) {
        throw Error('Model error: model.entity undefined');
    }

    switch (action.type) {
        case 'change-name':
            model.entity.name = action.name;
            return model;
        case 'change-description':
            model.entity.description = action.description;
            return model;
        default: {
            throw Error('Unknown ModelReducer action');
        }
    }
}
