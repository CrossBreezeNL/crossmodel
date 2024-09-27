/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Theme, ThemeOptions, ThemeProvider, createTheme } from '@mui/material';
import React = require('react');

const sharedThemeOptions: ThemeOptions = {
   components: {
      MuiButton: {
         defaultProps: {
            size: 'small'
         }
      },
      MuiButtonGroup: {
         defaultProps: {
            size: 'small'
         }
      },
      MuiCheckbox: {
         defaultProps: {
            size: 'small'
         }
      },
      MuiFab: {
         defaultProps: {
            size: 'small'
         }
      },
      MuiFormControl: {
         defaultProps: {
            size: 'small',
            margin: 'normal'
         }
      },
      MuiFormHelperText: {
         defaultProps: {
            margin: 'dense'
         }
      },
      MuiIconButton: {
         defaultProps: {
            size: 'small'
         }
      },
      MuiInputBase: {
         defaultProps: {
            fullWidth: true
         }
      },
      MuiInputLabel: {
         defaultProps: {}
      },
      MuiRadio: {
         defaultProps: {
            size: 'small'
         }
      },
      MuiSwitch: {
         defaultProps: {
            size: 'small'
         }
      },
      MuiTextField: {
         defaultProps: {
            size: 'small',
            fullWidth: true,
            sx: { margin: '8px 0' }
         }
      },
      MuiAutocomplete: {
         defaultProps: {
            size: 'small'
         }
      },
      MuiAccordion: {
         defaultProps: {
            disableGutters: true,
            elevation: 0,
            square: true,
            defaultExpanded: true
         }
      },
      MuiAccordionSummary: {
         defaultProps: {
            expandIcon: <ArrowDownwardIcon />,
            sx: { minHeight: 'auto' }
         }
      }
   },
   shape: {
      borderRadius: 2
   },
   spacing: 4,
   typography: {
      fontSize: 12,
      fontWeightBold: 400
   }
};

const lightTheme = createTheme({
   palette: {
      mode: 'light',
      primary: {
         main: '#007acc' /* --theia-button-background */,
         contrastText: '#ffffff' /* --theia-button-foreground */,
         dark: '#0062a3' /* --theia-button-hoverBackground */,
         light: '#1a85ff' /* --theia-editorInfo-foreground */
      },
      secondary: {
         main: '#5f6a79' /* --theia-button-secondaryBackground */,
         contrastText: '#ffffff' /* --theia-button-secondaryForeground */,
         dark: '#4c5561' /* --theia-button-secondaryHoverBackground */,
         light: '#6c6c6c' /* --theia-editorHint-foreground */
      },
      background: {
         default: '#ffffff' /* --theia-editor-background */,
         paper: '#ffffff' /* --theia-editor-background */
      },
      text: {
         primary: '#000000' /* --theia-editor-foreground */
      }
   },
   ...sharedThemeOptions
});

// Define dark theme settings
const darkTheme = createTheme({
   palette: {
      mode: 'dark',
      primary: {
         main: '#0e639c' /* --theia-button-background */,
         contrastText: '#ffffff' /* --theia-button-foreground */,
         dark: '#1177bb' /* --theia-button-hoverBackground */,
         light: '#3794ff' /* --theia-editorInfo-foreground */
      },
      secondary: {
         main: '#3a3d41' /* --theia-button-secondaryBackground */,
         contrastText: '#ffffff' /* --theia-button-secondaryForeground */,
         dark: '#45494e' /* --theia-button-secondaryHoverBackground */,
         light: 'rgba(238, 238, 238, 0.7)' /* --theia-editorHint-foreground */
      },
      background: {
         default: '#1e1e1e' /* --theia-editor-background */,
         paper: '#1e1e1e' /* --theia-editor-background */
      },
      text: {
         primary: '#d4d4d4' /* --theia-editor-foreground */
      }
   },
   ...sharedThemeOptions
});

export type ThemeType = 'light' | 'dark' | 'hc' | 'hcLight';

const getTheme = (type: ThemeType): Theme => (type === 'dark' ? darkTheme : lightTheme);

export interface ThemingProps {
   theme: ThemeType;
}

export function themed<P, TP extends ThemingProps>(
   WrappedComponent: React.ComponentType<P>
): React.ComponentType<P & TP & React.JSX.IntrinsicAttributes> {
   const ThemedComponent = (props: P & TP & React.JSX.IntrinsicAttributes): React.ReactElement => (
      <ThemeProvider theme={getTheme(props.theme)}>
         {/* do no include CssBaseline as it introduces global styles that conflict with Theia: <CssBaseline /> */}
         <WrappedComponent {...props} />
      </ThemeProvider>
   );
   return ThemedComponent;
}
