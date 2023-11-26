/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import * as React from 'react';
import '../../../style/entity-property-view.css';
import { useModel, useModelSave } from '../../ModelContext';
import { ErrorView } from '../ErrorView';
import { EntityAttributesDataGrid } from '../common/EntityAttributesDataGrid';
import { EntityGeneralForm } from '../common/EntityGeneralForm';
import { Accordion, AccordionDetails, AccordionSummary, SaveButton } from '../styled-elements';

// Container with the entity properties and attributes in accordions.
export function EntityPropertyView(): React.ReactElement {
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

// Accordion for the general entity properties.
function EntityPropertyGeneral(): React.ReactElement {
    const model = useModel();

    if (!model || !model.entity) {
        return <ErrorView errorMessage='Something went wrong loading the model!' />;
    }

    return (
        <Accordion defaultExpanded={true}>
            <AccordionSummary aria-controls='general-info-content' className='property-accordion'>
                General
            </AccordionSummary>
            <AccordionDetails className='property-entity-general'>
                <EntityGeneralForm />
            </AccordionDetails>
        </Accordion>
    );
}

// Accordion with the entity attributes in a data grid.
function EntityPropertyAttributes(): React.ReactElement {
    return (
        <Accordion defaultExpanded={true}>
            <AccordionSummary aria-controls='property-entity-attributes' className='property-accordion'>
                Attributes
            </AccordionSummary>
            <AccordionDetails className='property-entity-attributes'>
                <EntityAttributesDataGrid />
            </AccordionDetails>
        </Accordion>
    );
}
