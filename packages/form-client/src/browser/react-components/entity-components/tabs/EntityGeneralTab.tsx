/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as React from '@theia/core/shared/react';
import { ModelContext, ModelDispatchContext, ModelReducer } from '../../ModelContext';
import { CrossModelRoot } from '@crossbreeze/model-service';

interface GeneralTabProps {}

export function GeneralTab(props: GeneralTabProps): React.ReactElement {
    // Context variables to handle model state.
    const model = React.useContext(ModelContext) as CrossModelRoot;
    const dispatch = React.useContext(ModelDispatchContext) as React.Dispatch<React.ReducerAction<typeof ModelReducer>>;

    // Check if model initialized. Has to be here otherwise the compiler complains.
    if (model.entity === undefined) {
        return (
            <div
                style={{
                    backgroundColor: 'red',
                    color: 'white',
                    padding: '10px'
                }}
            >
                Model not initialized!
            </div>
        );
    }

    return (
        <form className='form-editor-general'>
            <div>
                <label>Name:</label>
                <input
                    // TODO, add debounce
                    className='theia-input'
                    value={model.entity.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        dispatch({ type: 'entity:change-name', name: e.target.value ? e.target.value : '' });
                    }}
                />
            </div>

            <div>
                <label>Description:</label>
                <textarea
                    className='theia-input'
                    value={model.entity.description}
                    rows={4}
                    onChange={(e: any) => {
                        dispatch({ type: 'entity:change-description', description: e.target.value });
                    }}
                />
            </div>
        </form>
    );
}
