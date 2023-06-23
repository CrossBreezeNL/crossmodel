/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as React from '@theia/core/shared/react';

export interface ErrorMessageProps extends React.HTMLProps<HTMLDivElement> {
    errorMessage: string;
}

export function ErrorView(props: ErrorMessageProps): React.ReactElement {
    return (
        <div
            style={{
                backgroundColor: 'red',
                color: 'white',
                padding: '10px'
            }}
        >
            {props.errorMessage}
        </div>
    );
}
