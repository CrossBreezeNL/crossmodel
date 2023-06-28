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
import { ModelContext, ModelDispatchContext, ModelReducer } from '../ModelContext';

export interface EntityPropertyViewProps extends React.HTMLProps<HTMLDivElement> {
    model: CrossModelRoot;
}

export function EntityPropertyView(props: EntityPropertyViewProps): React.ReactElement {
    const model = React.useContext(ModelContext) as CrossModelRoot;
    const dispatch = React.useContext(ModelDispatchContext) as React.Dispatch<React.ReducerAction<typeof ModelReducer>>;

    if (!model || !model.entity) {
        return <ErrorView errorMessage='Something went wrong loading the model!' />;
    }

    return (
        <div className='property-view-entity'>
            <h2>Entity: {model.entity.name}</h2>

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
