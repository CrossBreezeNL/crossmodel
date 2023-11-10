/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelRoot } from '@crossbreeze/protocol';
import * as React from 'react';
import { useImmerReducer } from 'use-immer';
import { ModelContext, ModelDispatchContext, SaveCallback, SaveModelContext, defaultSaveCallback } from './ModelContext';
import { DispatchAction, ModelReducer, ModelState } from './ModelReducer';

export type UpdateCallback = (model: CrossModelRoot) => void;

/**
 * Represents the properties required by the ModelProvider component.
 */
export interface ModelProviderProps extends React.PropsWithChildren {
    /**
     * The model object that will be provided to the child components.
     */
    model: CrossModelRoot;

    /**
     * A callback that will be triggered when the model is updated by this component.
     */
    onModelUpdate: UpdateCallback;

    /**
     * A callback that is triggered when this components want to save it's model
     */
    onModelSave?: SaveCallback;
}

/**
 * Based on the following implementation: https://react.dev/learn/scaling-up-with-reducer-and-context
 *
 * Provides the model and dispatch contexts to its children components.
 *
 * @param props ModelProviderProps
 * @returns JSX element
 */
export function ModelProvider({
    model,
    onModelSave = defaultSaveCallback,
    onModelUpdate,
    children
}: ModelProviderProps): React.ReactElement {
    const [appState, dispatch] = useImmerReducer<ModelState, DispatchAction>(ModelReducer, { model, reason: 'model:initial' });

    React.useEffect(() => {
        // triggered when a new model is passed from the outside via props -> update internal state
        dispatch({ type: 'model:update', model });
    }, [model, dispatch]);

    React.useEffect(() => {
        if (appState.reason !== 'model:update') {
            // triggered when the internal model is updated, pass update to callback
            onModelUpdate(appState.model);
        }
    }, [appState, onModelUpdate]);

    return (
        <ModelContext.Provider value={appState.model}>
            <SaveModelContext.Provider value={onModelSave}>
                <ModelDispatchContext.Provider value={dispatch}>{children}</ModelDispatchContext.Provider>
            </SaveModelContext.Provider>
        </ModelContext.Provider>
    );
}
