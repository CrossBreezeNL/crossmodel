/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import * as React from '@theia/core/shared/react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { ModelContext } from '../ModelContext';
import { GeneralTab } from './tabs/EntityGeneralTab';

export interface ModelProps {}

export function EntityForm(props: ModelProps): React.ReactElement {
    const model = React.useContext(ModelContext);

    if (!model.entity) {
        return (
            <div
                style={{
                    backgroundColor: 'red',
                    color: 'white',
                    padding: '10px'
                }}
            >
                This is not an entity model!
            </div>
        );
    }

    return (
        <>
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
        </>
    );
}
