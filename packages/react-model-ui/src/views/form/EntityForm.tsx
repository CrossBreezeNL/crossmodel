/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import * as React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import '../../../style/entity-form.css';
import { useModel } from '../../ModelContext';
import { ErrorView } from '../ErrorView';
import { EntityAttributesDataGrid } from '../common/EntityAttributesDataGrid';
import { EntityGeneralForm } from '../common/EntityGeneralForm';

// Form with tabs to edit an entity's properties and attributes.
export function EntityForm(): React.ReactElement {
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
                    <Tab>
                        <h3>Attributes</h3>
                    </Tab>
                </TabList>

                <TabPanel>
                    <EntityGeneralForm />
                </TabPanel>
                <TabPanel>
                    <EntityAttributesDataGrid />
                </TabPanel>
            </Tabs>
        </div>
    );
}
