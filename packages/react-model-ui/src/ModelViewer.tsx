/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { CrossModelRoot } from '@crossbreeze/protocol';
import * as React from 'react';
import { SaveCallback } from './ModelContext';
import { ModelProvider, UpdateCallback } from './ModelProvider';
import { ErrorView } from './views/ErrorView';

export interface ModelViewerProps {
    model: CrossModelRoot | undefined;
    onModelUpdate: UpdateCallback;
    onModelSave?: SaveCallback;
}

export function withModelProvider<P extends React.JSX.IntrinsicAttributes, MVP extends ModelViewerProps>(
    WrappedComponent: React.ComponentType<P>,
    { model, onModelUpdate, onModelSave }: MVP
): (props: P) => React.ReactElement {
    const ModelViewerReadyComponent = (componentProps: P): React.ReactElement => {
        if (!model) {
            return <ErrorView errorMessage='No Model Set!' />;
        }
        return (
            <ModelProvider model={model} onModelUpdate={onModelUpdate} onModelSave={onModelSave}>
                <WrappedComponent {...componentProps} />
            </ModelProvider>
        );
    };
    return ModelViewerReadyComponent;
}
