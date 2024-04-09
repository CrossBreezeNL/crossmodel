/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelRoot } from '@crossbreeze/protocol';
import * as React from 'react';
import { ModelQueryApi, OpenCallback, SaveCallback } from './ModelContext';
import { ModelProvider, UpdateCallback } from './ModelProvider';
import { ErrorView } from './views/ErrorView';

export interface ModelProviderProps {
   /**
    * The model object that will be provided to the child components.
    */
   model?: CrossModelRoot;

   /**
    * A callback that will be triggered when the model is updated by this component.
    */
   onModelUpdate: UpdateCallback;

   /**
    * A callback that is triggered when this components want to save it's model
    */
   onModelSave?: SaveCallback;

   /**
    * A callback that is triggered when this components want to save it's model
    */
   onModelOpen?: OpenCallback;

   /**
    * An API to query additional Model data.
    */
   modelQueryApi: ModelQueryApi;
}

export function withModelProvider<P, MVP extends ModelProviderProps>(
   WrappedComponent: React.ComponentType<P>,
   providerProps: MVP
): React.ComponentType<P & React.JSX.IntrinsicAttributes> {
   const ModelViewerReadyComponent = (props: P & React.JSX.IntrinsicAttributes): React.ReactElement => {
      if (!providerProps.model) {
         return <ErrorView errorMessage='No Model Set!' />;
      }
      return (
         <ModelProvider {...providerProps} model={providerProps.model!}>
            <WrappedComponent {...props} />
         </ModelProvider>
      );
   };
   return ModelViewerReadyComponent;
}
