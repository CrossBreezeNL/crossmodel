/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import * as React from '@theia/core/shared/react';
import { CrossModelRoot, Entity } from '../../common/form-client-protocol';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

import 'react-tabs/style/react-tabs.css';

export interface ModelProps {
    model: CrossModelRoot;
}
const ModelContext = React.createContext({} as Entity);

export function EntityElement(props: ModelProps): React.ReactElement {
    const [model] = React.useState(props.model);

    if (model.entity === undefined) {
        return <></>;
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
                    <Tab>General</Tab>
                    <Tab>Attributes</Tab>
                    <Tab>Mapping</Tab>
                </TabList>

                <ModelContext.Provider value={model.entity}>
                    <TabPanel>
                        <GeneralTab />
                    </TabPanel>
                    <TabPanel>
                        <AttributesTab />
                    </TabPanel>
                    <TabPanel>
                        <MappingsTab />
                    </TabPanel>
                </ModelContext.Provider>
            </Tabs>
        </div>
    );
}

function GeneralTab(props: any): React.ReactElement {
    const entity = React.useContext(ModelContext);

    return (
        <form className='form-editor-general'>
            <div>
                <label>Name:</label>
                <input
                    className='theia-input'
                    value={entity.name}
                    onChange={e => {
                        // props.entity.description = e.target.value;
                        // props.updateModel(e);
                    }}
                />
            </div>

            <div>
                <label>Stereotype:</label>
                <input
                    className='theia-input'
                    value={entity.name}
                    onChange={e => {
                        // props.entity.description = e.target.value;
                        // props.updateModel(e);
                    }}
                />
            </div>

            <div>
                <label>Description:</label>
                <textarea
                    className='theia-input'
                    value={entity.description}
                    rows={4}
                    onChange={e => {
                        // props.entity.description = e.target.value;
                        // props.updateModel(e);
                    }}
                />
            </div>
        </form>
    );
}

function AttributesTab(props: any): React.ReactElement {
    return (
        <div>
            Description:
            <input
                className='theia-input'
                value={'Entity1'}
                onChange={e => {
                    // props.entity.description = e.target.value;
                    // props.updateModel(e);
                }}
            />
        </div>
    );
}

function MappingsTab(props: any): React.ReactElement {
    return (
        <div>
            <h1>TODO</h1>
        </div>
    );
}
