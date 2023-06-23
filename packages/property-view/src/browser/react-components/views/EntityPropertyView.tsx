/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

// mui
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import { styled } from '@mui/material/styles';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';

// other
import { CrossModelRoot } from '@crossbreeze/model-service';
import * as React from '@theia/core/shared/react';
import { ErrorView } from './ErrorView';

export interface EntityPropertyViewProps extends React.HTMLProps<HTMLDivElement> {
    model: CrossModelRoot;
}

export function EntityPropertyView(props: EntityPropertyViewProps): React.ReactElement {
    if (!props.model.entity) {
        return <ErrorView errorMessage='Something went wrong loading the model!' />;
    }

    return (
        <div className='property-view-entity'>
            <h2>Entity: {props.model.entity.name}</h2>

            <Accordion defaultExpanded={true}>
                <AccordionSummary aria-controls='general-info-content' className='property-accordion'>
                    {' '}
                    General information{' '}
                </AccordionSummary>
                <AccordionDetails className='property-entity-general'>
                    <div>
                        <label>Name:</label>
                        <input value={props.model.entity.name} className={'theia-input'} />
                    </div>

                    <div>
                        <label>Description:</label>
                        <textarea rows={4} value={props.model.entity.description} className={'theia-input'} />
                    </div>
                </AccordionDetails>
            </Accordion>
        </div>
    );
}

const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} square {...props} />)(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    '&:not(:last-child)': {
        borderBottom: 0
    },
    '&:before': {
        display: 'none'
    }
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
    <MuiAccordionSummary expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />} {...props} />
))(({ theme }) => ({
    backgroundColor: 'rgba(0, 0, 0, .03)',
    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
        transform: 'rotate(90deg)'
    },
    '& .MuiAccordionSummary-content': {
        marginLeft: theme.spacing(1)
    }
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    padding: theme.spacing(2),
    borderTop: '1px solid rgba(0, 0, 0, .125)'
}));
