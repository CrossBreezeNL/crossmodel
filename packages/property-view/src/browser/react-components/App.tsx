/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import * as React from '@theia/core/shared/react';
import { ErrorView } from './views/ErrorView';
import { EntityPropertyView } from './views/EntityPropertyView';

export function App(props: any): React.ReactElement {
    let content = <></>;

    if (!props.model) {
        return <ErrorView errorMessage='No model given to the property view!' />;
    }

    if (props.model.entity) {
        content = <EntityPropertyView model={props.model} />;
    } else {
        return <ErrorView errorMessage='Unknown model type!' />;
    }

    return content;
}
