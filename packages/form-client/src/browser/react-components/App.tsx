/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import * as React from '@theia/core/shared/react';
import { CrossModelRoot } from '../../common/form-client-protocol';
import { FormEditorClientImpl } from '../form-client';
import URI from '@theia/core/lib/common/uri';

interface AppProps {
    updateModel: (model: CrossModelRoot) => void;
    model: CrossModelRoot | undefined;
    getResourceUri: () => URI;
    formClient: FormEditorClientImpl;
}

export function App(props: AppProps): React.ReactElement {
    const [model, setModel] = React.useState(props.model);

    function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
        const newModel: CrossModelRoot | undefined = structuredClone(props.model);

        if (!newModel || !newModel.entity) {
            return;
        }

        newModel.entity.name = event.target.value;
        props.updateModel(structuredClone(newModel));
        setModel(newModel);
    }

    React.useEffect(() => {
        props.formClient.onUpdate(document => {
            if (document.uri === props.getResourceUri().toString()) {
                setModel(document.model);
            }
        });
    }, [props, model]);

    // Rendering logic
    if (!model) {
        return <div>loading</div>;
    } else if (model.entity) {
        return (
            <div>
                <h1>{model.entity?.name}</h1>

                <input type='text' value={model.entity?.name} onChange={handleChange} />
            </div>
        );
    }

    return <></>;
}
