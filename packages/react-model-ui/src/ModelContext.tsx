/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { CrossModelRoot } from '@crossbreeze/protocol';
import * as React from 'react';
import { DispatchAction, ModelReducer } from './ModelReducer';

export type SaveCallback = () => void;

export const defaultSaveCallback = (): void => {
    console.log('Saving this model is not supported.');
};

export const ModelContext = React.createContext<CrossModelRoot>({ $type: 'CrossModelRoot' });
export const ModelDispatchContext = React.createContext<React.Dispatch<React.ReducerAction<typeof ModelReducer>>>(x => x);
export const SaveModelContext = React.createContext<SaveCallback>(defaultSaveCallback);

export function useModel(): CrossModelRoot {
    return React.useContext(ModelContext);
}

export function useModelDispatch(): React.Dispatch<DispatchAction> {
    return React.useContext(ModelDispatchContext);
}

export function useModelSave(): SaveCallback {
    return React.useContext(SaveModelContext);
}
