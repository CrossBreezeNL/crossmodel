/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as React from '@theia/core/shared/react';
import { CrossModelRoot } from '../../common/form-client-protocol';

interface ModelProviderProps {
    model: CrossModelRoot;
    dispatch: React.Dispatch<React.ReducerAction<typeof ModelReducer>>;
    children: React.ReactElement;
}

export const ModelContext = React.createContext({} as CrossModelRoot);
export const ModelDispatchContext = React.createContext({});

export function ModelProvider(props: ModelProviderProps): React.ReactElement {
    return (
        <ModelContext.Provider value={props.model}>
            <ModelDispatchContext.Provider value={props.dispatch}>{props.children}</ModelDispatchContext.Provider>
        </ModelContext.Provider>
    );
}

export function ModelReducer(model: CrossModelRoot, action: any): CrossModelRoot {
    if (model === undefined) {
        throw Error('Model error: model.entity undefined');
    }

    // You have to make a copy, otherwise it does not work. Why??
    model = structuredClone(model);

    switch (action.type) {
        case 'model:update':
            return action.model;
        case 'entity:change-name':
            if (!model.entity) {
                throw Error('model.entity undefined');
            } else if (action.name === undefined) {
                throw Error('action.name undefined');
            }

            model.entity.name = action.name;
            return model;
        case 'entity:change-description':
            if (!model.entity) {
                throw Error('Model.entity undefined');
            } else if (action.description === undefined) {
                throw Error('action.description undefined');
            }

            model.entity.description = action.description;
            return model;

        case 'entity:attribute:change-datatype':
            if (!model.entity) {
                throw Error('Model.entity undefined');
            } else if (action.id === undefined || action.dataType === undefined) {
                throw Error('action.id or dataType is undefined');
            }

            model.entity.attributes[action.id].value = action.dataType;

            return model;

        case 'entity:attribute:change-name':
            if (!model.entity) {
                throw Error('Model.entity undefined');
            } else if (action.id === undefined || action.name === undefined) {
                throw Error('action.id or name is undefined');
            }

            model.entity.attributes[action.id].name = action.name;

            return model;

        default: {
            throw Error('Unknown ModelReducer action');
        }
    }
}
