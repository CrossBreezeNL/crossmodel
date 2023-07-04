/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

// other
import { CrossModelRoot } from '@crossbreeze/model-service';
import * as React from '@theia/core/shared/react';
import { ErrorView } from './ErrorView';
import { ModelContext, ModelDispatchContext, ModelReducer } from '../ModelContext';
import { Accordion, AccordionDetails, AccordionSummary, SaveButton } from './styled-elements';
import { EntityPropertyAttributes } from './EntityPropertyAttributeGrid';
import SaveModelContext from '../SaveModelContext';

export interface EntityPropertyViewProps extends React.HTMLProps<HTMLDivElement> {}

export function EntityPropertyView(props: EntityPropertyViewProps): React.ReactElement {
    const model = React.useContext(ModelContext) as CrossModelRoot;
    const saveModel = React.useContext(SaveModelContext);

    const onSaveButtonClick = (): void => {
        saveModel();
    };

    if (!model || !model.entity) {
        return <ErrorView errorMessage='Something went wrong loading the model!' />;
    }

    return (
        <div className='property-view-entity'>
            <h2>Entity: {model.entity.name}</h2>
            <EntityPropertyGeneral />
            <EntityPropertyAttributes />
            <SaveButton onClick={onSaveButtonClick}> Save </SaveButton>
        </div>
    );
}

interface EntityPropertyGeneralProps extends React.HTMLProps<HTMLDivElement> {}

function EntityPropertyGeneral(props: EntityPropertyGeneralProps): React.ReactElement {
    const model = React.useContext(ModelContext) as CrossModelRoot;
    const dispatch = React.useContext(ModelDispatchContext) as React.Dispatch<React.ReducerAction<typeof ModelReducer>>;

    if (!model || !model.entity) {
        return <ErrorView errorMessage='Something went wrong loading the model!' />;
    }

    return (
        <Accordion defaultExpanded={true}>
            <AccordionSummary aria-controls='general-info-content' className='property-accordion'>
                General information
            </AccordionSummary>
            <AccordionDetails className='property-entity-general'>
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
            </AccordionDetails>
        </Accordion>
    );
}
