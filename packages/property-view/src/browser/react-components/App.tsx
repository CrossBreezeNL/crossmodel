/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import * as React from '@theia/core/shared/react';
import { ErrorView } from './views/ErrorView';
import { CrossModelRoot } from '@crossbreeze/protocol';
import { ModelProvider, ModelReducer } from './ModelContext';
import { EntityPropertyView } from './views/EntityPropertyView';
import SaveModelContext from './SaveModelContext';
import _ = require('lodash');

interface AppProperty {
    model: CrossModelRoot | undefined;
    saveModel: () => void;
    updateModel: (model: CrossModelRoot) => void;
}

export function App(props: AppProperty): React.ReactElement {
    const [model, dispatch] = React.useReducer(ModelReducer, props.model as CrossModelRoot);

    React.useEffect(() => {
        dispatch({ type: 'model:update', model: props.model });
    }, [props.model]);

    React.useEffect(() => {
        props.updateModel(_.cloneDeep(model));
    }, [model, props]);

    let content = <></>;

    if (!model) {
        return <></>;
    }

    if (model.entity) {
        content = <EntityPropertyView />;
    } else {
        return <ErrorView errorMessage='Unknown model type!' />;
    }

    return (
        <SaveModelContext.Provider value={props.saveModel}>
            <ModelProvider model={model} dispatch={dispatch}>
                {content}
            </ModelProvider>
        </SaveModelContext.Provider>
    );
}
