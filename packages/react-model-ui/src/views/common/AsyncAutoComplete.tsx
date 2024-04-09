/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
/* eslint-disable no-null/no-null */
import { Autocomplete, AutocompleteProps, CircularProgress, TextField, TextFieldProps } from '@mui/material';
import React = require('react');

export interface AsyncAutoCompleteProps<T> extends Omit<AutocompleteProps<T, false, true, false>, 'renderInput' | 'options'> {
   label: string;
   optionLoader: () => Promise<T[]>;
   textFieldProps?: TextFieldProps;
}

// Based on https://mui.com/material-ui/react-autocomplete/
export default function AsyncAutoComplete<T>({ label, optionLoader, ...props }: AsyncAutoCompleteProps<T>): React.ReactElement {
   const [open, setOpen] = React.useState(false);
   const [options, setOptions] = React.useState<readonly T[]>([]);
   const loading = open && options.length === 0;

   React.useEffect(() => {
      let active = true;
      if (!loading) {
         return undefined;
      }
      const loadOperation = async (): Promise<void> => {
         const loadedOptions = await optionLoader();
         if (active) {
            setOptions([...loadedOptions]);
         }
      };
      loadOperation();

      return () => {
         active = false;
      };
   }, [loading, optionLoader]);

   React.useEffect(() => {
      if (!open) {
         setOptions([]);
      }
   }, [open]);

   return (
      <Autocomplete
         open={open}
         onOpen={() => setOpen(true)}
         onClose={() => setOpen(false)}
         options={options}
         loading={loading}
         disableClearable={true}
         handleHomeEndKeys={true}
         {...props}
         renderInput={params => (
            <TextField
               {...params}
               {...props.textFieldProps}
               label={label}
               InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                     <React.Fragment>
                        {loading ? <CircularProgress color='inherit' size={20} /> : null}
                        {params.InputProps.endAdornment}
                     </React.Fragment>
                  )
               }}
            />
         )}
      />
   );
}
