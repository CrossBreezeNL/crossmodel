/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as React from '@theia/core/shared/react';
import { CrossModelRoot } from '@crossbreeze/model-service';
import * as _ from 'lodash';

/**
 * Represents the properties required by the ModelProvider component.
 */
interface ModelProviderProps {
    /**
     * The model object that will be provided to the child components.
     */
    model: CrossModelRoot;
    /**
     * The dispatch function for updating the model using the ModelReducer.
     */
    dispatch: React.Dispatch<React.ReducerAction<typeof ModelReducer>>;
    /**
     * The child component(s) to be rendered within the ModelProvider. These are automatically included when
     * passing props.
     */
    children: React.ReactElement;
}

export const ModelContext = React.createContext({} as CrossModelRoot);
export const ModelDispatchContext = React.createContext({});

/**
 * Based on the following implementation: https://react.dev/learn/scaling-up-with-reducer-and-context
 *
 * Provides the model and dispatch contexts to its children components.
 *
 * @param props ModelProviderProps
 * @returns JSX element
 */
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

    // You have to make a copy. When changing the model itself, react wont update correctly.
    // https://react.dev/learn/updating-objects-in-state
    model = _.cloneDeep(model);

    switch (action.type) {
        // Update the entire model
        case 'model:update':
            return action.model;

        // Change the name of the entity-model
        case 'entity:change-name':
            if (!model.entity) {
                throw Error('model.entity undefined');
            } else if (action.name === undefined) {
                throw Error('action.name undefined');
            }

            model.entity.name = action.name;
            return model;

        // Change the name of the entity-model
        case 'entity:change-description':
            if (!model.entity) {
                throw Error('Model.entity undefined');
            } else if (action.description === undefined) {
                throw Error('action.description undefined');
            }

            model.entity.description = action.description;
            return model;

        // Change the datatype of one of entity attributes
        case 'entity:attribute:change-datatype':
            if (!model.entity) {
                throw Error('Model.entity undefined');
            } else if (action.id === undefined || action.dataType === undefined) {
                throw Error('action.id or dataType is undefined');
            }

            model.entity.attributes[action.id].value = action.dataType;

            return model;

        // Change the name of one of entity attributes
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
