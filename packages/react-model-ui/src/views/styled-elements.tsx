/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
// mui
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import Button, { ButtonProps } from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import * as React from 'react';

export const Accordion = styled((props: AccordionProps) => <MuiAccordion disableGutters elevation={0} square {...props} />)(
   ({ theme }) => ({
      border: `1px solid ${theme.palette.divider}`,
      '&:not(:last-child)': {
         borderBottom: 0
      },
      '&:before': {
         display: 'none'
      }
   })
);

export const AccordionSummary = styled((props: AccordionSummaryProps) => (
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

export const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
   padding: theme.spacing(2),
   borderTop: '1px solid rgba(0, 0, 0, .125)'
}));

export const SaveButton = styled((props: ButtonProps) => <Button {...props} variant='contained' />)(({ theme }) => ({
   margin: '10px',
   float: 'right'
}));
