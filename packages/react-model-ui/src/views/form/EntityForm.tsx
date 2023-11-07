/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { useModel } from '../../ModelContext';
import { ErrorView } from '../ErrorView';
import { GeneralTab } from './tabs/EntityGeneralTab';

export interface ModelProps {}

export function EntityForm(_props: ModelProps): React.ReactElement {
    const model = useModel();

    if (!model.entity) {
        return <ErrorView errorMessage='This is not an entity model!' />;
    }

    return (
        <div className='form-editor'>
            <div className='form-editor-header'>
                <h1>
                    <span className='label'>Entity : </span>
                    <span className='value'>{model.entity.name}</span>
                </h1>
            </div>
            <Tabs>
                <TabList>
                    <Tab>
                        <h3>General</h3>
                    </Tab>
                    {/* <Tab>
                        <h3>Attributes</h3>
                    </Tab>
                    */}
                </TabList>

                <TabPanel>
                    <GeneralTab />
                </TabPanel>
            </Tabs>
        </div>
    );
}
