/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelRoot } from '@crossbreezenl/protocol';
import * as React from 'react';
import { useImmerReducer } from 'use-immer';
import {
   ModelContext,
   ModelDiagnosticsContext,
   ModelDirtyContext,
   ModelDispatchContext,
   ModelQueryApiContext,
   OpenModelContext,
   SaveModelContext
} from './ModelContext';
import { DispatchAction, ModelReducer, ModelState } from './ModelReducer';
import { ModelProviderProps } from './ModelViewer';

export type UpdateCallback = (model: CrossModelRoot) => void;

/**
 * Represents the properties required by the ModelProvider component.
 */
export interface InternalModelProviderProps extends React.PropsWithChildren, ModelProviderProps {}

/**
 * Based on the following implementation: https://react.dev/learn/scaling-up-with-reducer-and-context
 *
 * Provides the model and dispatch contexts to its children components.
 *
 * @param props ModelProviderProps
 * @returns JSX element
 */
export function ModelProvider({
   document,
   dirty,
   onModelOpen,
   onModelSave,
   onModelUpdate,
   modelQueryApi,
   children
}: InternalModelProviderProps): React.ReactElement {
   const [appState, dispatch] = useImmerReducer<ModelState, DispatchAction>(ModelReducer, {
      model: document.root,
      reason: 'model:initial'
   });

   React.useEffect(() => {
      // triggered when a new model is passed from the outside via props -> update internal state
      // we only use 'document' as dependency as the root also changes on internal updates
      console.debug('[ModelProvider] Receive external update through props');
      dispatch({ type: 'model:update', model: document.root });
   }, [dispatch, document]);

   React.useEffect(() => {
      if (appState.reason !== 'model:initial' && appState.reason !== 'model:update') {
         // triggered when the internal model is updated, pass update to callback
         console.debug('[ModelProvider] Trigger external update through callback');
         onModelUpdate(appState.model);
      }
   }, [appState, onModelUpdate]);

   return (
      <ModelContext.Provider value={appState.model}>
         <OpenModelContext.Provider value={onModelOpen}>
            <SaveModelContext.Provider value={onModelSave}>
               <ModelDispatchContext.Provider value={dispatch}>
                  <ModelDirtyContext.Provider value={dirty}>
                     <ModelDiagnosticsContext.Provider value={document.diagnostics}>
                        <ModelQueryApiContext.Provider value={modelQueryApi}>{children}</ModelQueryApiContext.Provider>
                     </ModelDiagnosticsContext.Provider>
                  </ModelDirtyContext.Provider>
               </ModelDispatchContext.Provider>
            </SaveModelContext.Provider>
         </OpenModelContext.Provider>
      </ModelContext.Provider>
   );
}
