/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import { GridExpandMoreIcon } from '@mui/x-data-grid';
import * as React from 'react';

export interface FormSectionProps extends React.PropsWithChildren {
   label: string;
}

export function FormSection({ label, children }: FormSectionProps): React.ReactElement {
   return (
      <Accordion>
         <AccordionSummary
            expandIcon={<GridExpandMoreIcon />}
            sx={{
               '& .MuiAccordionSummary-content': {
                  m: '0.5em 0'
               }
            }}
         >
            <Typography variant='h6'>{label}</Typography>
         </AccordionSummary>
         <AccordionDetails>{children}</AccordionDetails>
      </Accordion>
   );
}
