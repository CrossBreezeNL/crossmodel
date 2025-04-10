/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import {
   CrossModelRoot,
   CrossReferenceContext,
   LogicalEntity,
   Mapping,
   ModelDiagnostic,
   ReferenceableElement,
   Relationship
} from '@crossbreezenl/protocol';
import * as React from 'react';
import { DispatchAction, ModelReducer } from './ModelReducer';

export type SaveCallback = () => void;
export type OpenCallback = () => void;

export interface ModelQueryApi {
   findReferenceableElements(args: CrossReferenceContext): Promise<ReferenceableElement[]>;
}

const DEFAULT_MODEL_ROOT: CrossModelRoot = { $type: 'CrossModelRoot' };
export const ModelContext = React.createContext(DEFAULT_MODEL_ROOT);

export type ActionDispatcher = React.Dispatch<React.ReducerAction<typeof ModelReducer>>;
export const DEFAULT_MODEL_REDUCER: ActionDispatcher = x => x;
export const ModelDispatchContext = React.createContext<ActionDispatcher>(DEFAULT_MODEL_REDUCER);

export const DEFAULT_OPEN_CALLBACK = (): void => console.log('Opening this model is not supported.');
export const OpenModelContext = React.createContext<OpenCallback | undefined>(undefined);

export const DEFAULT_SAVE_CALLBACK = (): void => console.log('Saving this model is not supported.');
export const SaveModelContext = React.createContext<SaveCallback | undefined>(undefined);

export const DEFAULT_QUERY_API: ModelQueryApi = { findReferenceableElements: async () => [] };
export const ModelQueryApiContext = React.createContext<ModelQueryApi>(DEFAULT_QUERY_API);

export const ModelDirtyContext = React.createContext<boolean>(false);

export const ModelDiagnosticsContext = React.createContext<ModelDiagnostic[]>([]);

export function useModel(): CrossModelRoot {
   return React.useContext(ModelContext);
}

export function useModelDispatch(): React.Dispatch<DispatchAction> {
   return React.useContext(ModelDispatchContext);
}

export function useModelSave(): SaveCallback | undefined {
   return React.useContext(SaveModelContext);
}

export function useModelOpen(): OpenCallback | undefined {
   return React.useContext(OpenModelContext);
}

export function useModelQueryApi(): ModelQueryApi {
   return React.useContext(ModelQueryApiContext);
}

export function useDiagnostics(): ModelDiagnostic[] {
   return React.useContext(ModelDiagnosticsContext);
}

export function useDirty(): boolean {
   return React.useContext(ModelDirtyContext);
}

export function useReadonly(): boolean {
   return ModelDiagnostic.hasParseErrors(useDiagnostics());
}

export function useEntity(): LogicalEntity {
   return useModel().entity!;
}

export function useRelationship(): Relationship {
   return useModel().relationship!;
}

export function useMapping(): Mapping {
   return useModel().mapping!;
}
