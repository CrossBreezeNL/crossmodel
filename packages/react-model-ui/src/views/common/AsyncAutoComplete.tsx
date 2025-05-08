/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
/* eslint-disable no-null/no-null */
import { Autocomplete, AutocompleteProps, CircularProgress, TextField, TextFieldProps } from '@mui/material';
import { useReadonly } from '../../ModelContext';
import React = require('react');

export interface AsyncAutoCompleteProps<T> extends Omit<AutocompleteProps<T, false, true, false>, 'renderInput' | 'options'> {
   label: string;
   optionLoader: () => Promise<T[]>;
   /**
    * MUI shows a warning if the current value doesn't match an available option.
    * This callback can be used to synchronize selection state with options.
    */
   onOptionsLoaded?: (options: T[]) => unknown;
   textFieldProps?: TextFieldProps;
}

// Based on https://mui.com/material-ui/react-autocomplete/
export default function AsyncAutoComplete<T>({
   label,
   optionLoader,
   onOptionsLoaded,
   textFieldProps,
   ...props
}: AsyncAutoCompleteProps<T>): React.ReactElement {
   const [open, setOpen] = React.useState(!!props.open);
   const [options, setOptions] = React.useState<readonly T[]>([]);
   const loading = open && options.length === 0;
   const readonly = useReadonly();

   React.useEffect(() => {
      let active = true;
      if (!loading) {
         return undefined;
      }
      const loadOperation = async (): Promise<void> => {
         const loadedOptions = await optionLoader();
         if (active) {
            onOptionsLoaded?.(loadedOptions);
            setOptions([...loadedOptions]);
         }
      };
      loadOperation();

      return () => {
         active = false;
      };
   }, [loading, optionLoader, onOptionsLoaded]);

   return (
      <Autocomplete
         open={open}
         onOpen={() => setOpen(true)}
         onClose={() => setOpen(false)}
         options={options}
         loading={loading}
         disabled={readonly}
         disableClearable={true}
         handleHomeEndKeys={true}
         {...props}
         renderInput={params => (
            <TextField
               {...params}
               {...textFieldProps}
               label={label}
               InputProps={{
                  ...params.InputProps,
                  required: textFieldProps?.required,
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
