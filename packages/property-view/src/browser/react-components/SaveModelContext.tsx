/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as React from '@theia/core/shared/react';

const defaultSaveModel = (): void => {
    console.log('No saveModel function provided.');
};

const SaveModelContext = React.createContext(defaultSaveModel);

export default SaveModelContext;
