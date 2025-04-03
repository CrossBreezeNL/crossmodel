/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelDocument } from '@crossbreezenl/protocol';
import * as React from 'react';
import { ModelQueryApi, OpenCallback, SaveCallback } from './ModelContext';
import { ModelProvider, UpdateCallback } from './ModelProvider';
import { ErrorView } from './views/ErrorView';

export interface ModelProviderProps {
   /**
    * The model object that will be provided to the child components.
    */
   document: CrossModelDocument;

   dirty: boolean;

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

export function modelComponent<P, MVP extends ModelProviderProps>(
   WrappedComponent: React.ComponentType<P>
): React.ComponentType<P & MVP & React.JSX.IntrinsicAttributes> {
   const ModelViewerReadyComponent = (props: P & MVP & React.JSX.IntrinsicAttributes): React.ReactElement => {
      if (!props.document) {
         return <ErrorView errorMessage='No Model Set!' />;
      }
      return (
         <ModelProvider {...props}>
            <WrappedComponent {...props} />
         </ModelProvider>
      );
   };
   return ModelViewerReadyComponent;
}
