/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import * as React from '@theia/core/shared/react';
import { CrossModelRoot } from '@crossbreeze/protocol';
import { FormEditorClientImpl } from '../form-client';
import URI from '@theia/core/lib/common/uri';
import { ModelReducer, ModelProvider } from './ModelContext';
import { EntityForm } from './entity-components/EntityForm';
import _ = require('lodash');

interface AppProps {
    updateModel: (model: CrossModelRoot) => void;
    model: CrossModelRoot | undefined;
    getResourceUri: () => URI;
    formClient: FormEditorClientImpl;
}

export function App(props: AppProps): React.ReactElement {
    const [model, dispatch] = React.useReducer(ModelReducer, props.model as CrossModelRoot);

    // Subscribing to the updates made to the model by a different editor
    React.useEffect(() => {
        props.formClient.onUpdate(document => {
            if (document.uri === props.getResourceUri().toString()) {
                dispatch({ type: 'model:update', model: document.model });
            }
        });
    }, [props]);

    // This effect gets triggered when the model gets updated, it will pass the new model
    // to the Form-widget and that will pass it to the server to update
    React.useEffect(() => {
        props.updateModel(_.cloneDeep(model));
    }, [model, props]);

    let render = undefined;

    // Rendering logic
    if (!model) {
        render = <div>loading</div>;
    } else if (model.entity) {
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
            <ModelProvider model={model} dispatch={dispatch}>
                {render}
            </ModelProvider>
        </div>
    );
}
