/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { ModelServiceClient } from '@crossbreeze/model-service/lib/common';
import { CrossModelRoot } from '@crossbreeze/protocol';
import URI from '@theia/core/lib/common/uri';
import * as React from '@theia/core/shared/react';
import { AppState, ModelProvider, ModelReducer } from './ModelContext';
import { EntityForm } from './entity-components/EntityForm';
import _ = require('lodash');

interface AppProps {
    updateModel: (model: CrossModelRoot) => void;
    model: CrossModelRoot | undefined;
    getResourceUri: () => URI;
    formClient: ModelServiceClient;
}

export function App({ model, updateModel }: AppProps): React.ReactElement {
    const [appState, dispatch] = React.useReducer(ModelReducer, { model, reason: '' } as AppState);

    React.useEffect(() => {
        // triggered when a new model is passed from the outside (widget) -> update internal state
        dispatch({ type: 'model:update', model: model });
    }, [model]);

    React.useEffect(() => {
        if (appState.reason !== 'model:update') {
            // triggered when the internal model is updated, pass update to server
            updateModel(_.cloneDeep(appState.model));
        }
    }, [appState, updateModel]);

    let render = undefined;

    // Rendering logic
    if (!appState?.model) {
        render = <div>loading</div>;
    } else if (appState.model.entity) {
        render = <EntityForm />;
    } else {
        render = (
            <div
                style={{
                    backgroundColor: 'red',
                    color: 'white',
                    padding: '10px'
                }}
            >
                Model not loaded!
            </div>
        );
    }

    return (
        <div className='form-editor'>
            <ModelProvider model={appState.model} dispatch={dispatch}>
                {render}
            </ModelProvider>
        </div>
    );
}
