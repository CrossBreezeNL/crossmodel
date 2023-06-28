/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import * as React from '@theia/core/shared/react';
import { ErrorView } from './views/ErrorView';
import { CrossModelRoot } from '@crossbreeze/model-service';
import { ModelProvider, ModelReducer } from './ModelContext';
import { EntityPropertyView } from './views/EntityPropertyView';

export function App(props: any): React.ReactElement {
    const [model, dispatch] = React.useReducer(ModelReducer, props.model as CrossModelRoot);

    React.useEffect(() => {
        dispatch({ type: 'model:update', model: props.model });
    }, [props.model]);

    let content = <></>;

    if (!model) {
        return <ErrorView errorMessage='No model given to the property view!' />;
    }

    if (model.entity) {
        content = <EntityPropertyView model={props.model} />;
    } else {
        return <ErrorView errorMessage='Unknown model type!' />;
    }

    return (
        <ModelProvider model={model} dispatch={dispatch}>
            <>{content}</>
        </ModelProvider>
    );
}
