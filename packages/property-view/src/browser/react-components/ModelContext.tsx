/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as React from '@theia/core/shared/react';
import { CrossModelRoot } from '@crossbreeze/protocol';
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

            model.entity.name_val = action.name;

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

            model.entity.attributes[action.id].datatype = action.dataType;

            return model;

        // Change the name of one of entity attributes
        case 'entity:attribute:change-name':
            if (!model.entity) {
                throw Error('Model.entity undefined');
            } else if (action.id === undefined || action.name === undefined) {
                throw Error('action.id or name is undefined');
            }

            model.entity.attributes[action.id].name_val = action.name;

            return model;

        case 'entity:attribute:add-empty':
            if (!model.entity) {
                throw Error('Model.entity undefined');
            }

            model.entity.attributes.push({
                $type: 'EntityAttribute',
                name: `empty_attribute${model.entity.attributes.length}`,
                datatype: 'Float'
            });

            return model;
        case 'entity:attribute:move-attribute-up':
            if (!model.entity) {
                throw Error('Model.entity undefined');
            } else if (action.id === undefined) {
                throw Error('action.id or name is undefined');
            }

            if (action.id > 0) {
                const temp = model.entity.attributes[action.id - 1];
                model.entity.attributes[action.id - 1] = model.entity.attributes[action.id];
                model.entity.attributes[action.id] = temp;
            }

            return model;
        case 'entity:attribute:move-attribute-down':
            if (!model.entity) {
                throw Error('Model.entity undefined');
            } else if (action.id === undefined) {
                throw Error('action.id or name is undefined');
            }

            if (action.id < model.entity.attributes.length - 1) {
                const temp = model.entity.attributes[action.id + 1];
                model.entity.attributes[action.id + 1] = model.entity.attributes[action.id];
                model.entity.attributes[action.id] = temp;
            }

            return model;
        case 'entity:attribute:delete-attribute':
            if (!model.entity) {
                throw Error('Model.entity undefined');
            } else if (action.id === undefined) {
                throw Error('action.id or name is undefined');
            }

            model.entity.attributes.splice(action.id, 1);

            return model;

        default: {
            throw Error('Unknown ModelReducer action');
        }
    }
}
