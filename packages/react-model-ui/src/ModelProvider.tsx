/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelRoot } from '@crossbreeze/protocol';
import * as React from 'react';
import { useImmerReducer } from 'use-immer';
import { ModelContext, ModelDispatchContext, ModelQueryApiContext, OpenModelContext, SaveModelContext } from './ModelContext';
import { DispatchAction, ModelReducer, ModelState } from './ModelReducer';
import { ModelProviderProps } from './ModelViewer';

export type UpdateCallback = (model: CrossModelRoot) => void;

/**
 * Represents the properties required by the ModelProvider component.
 */
export interface InternalModelProviderProps extends React.PropsWithChildren, ModelProviderProps {
   model: CrossModelRoot;
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
   onModelOpen,
   onModelSave,
   onModelUpdate,
   modelQueryApi,
   children
}: InternalModelProviderProps): React.ReactElement {
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
         <OpenModelContext.Provider value={onModelOpen}>
            <SaveModelContext.Provider value={onModelSave}>
               <ModelDispatchContext.Provider value={dispatch}>
                  <ModelQueryApiContext.Provider value={modelQueryApi}>{children}</ModelQueryApiContext.Provider>
               </ModelDispatchContext.Provider>
            </SaveModelContext.Provider>
         </OpenModelContext.Provider>
      </ModelContext.Provider>
   );
}
