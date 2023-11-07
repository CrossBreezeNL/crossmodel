/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import * as React from '@theia/core/shared/react';
import { useModel, useModelDispatch, useModelSave } from '../../ModelContext';
import { ErrorView } from '../ErrorView';
import { EntityPropertyAttributes } from './EntityPropertyAttributeGrid';
import { Accordion, AccordionDetails, AccordionSummary, SaveButton } from '../styled-elements';

export interface EntityPropertyViewProps extends React.HTMLProps<HTMLDivElement> {}

export function EntityPropertyView(_props: EntityPropertyViewProps): React.ReactElement {
    const model = useModel();
    const saveModel = useModelSave();

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

function EntityPropertyGeneral(_props: EntityPropertyGeneralProps): React.ReactElement {
    const model = useModel();
    const dispatch = useModelDispatch();

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
                        className='theia-input'
                        value={model.entity.name_val}
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
