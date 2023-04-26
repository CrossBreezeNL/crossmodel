/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import * as React from '@theia/core/shared/react';
import { CrossModelRoot } from '../../../common/form-client-protocol';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';

import 'react-tabs/style/react-tabs.css';
import { ModelContext, ModelDispatchContext, ModelReducer, UpdateModelContext } from './EntityContext';
import { EntityAttributesTab } from './EntityAttributesTab';

export interface ModelProps {
    model: CrossModelRoot;
    updateModel: any;
}

export function EntityForm(props: ModelProps): React.ReactElement {
    const [model, dispatch] = React.useReducer(ModelReducer, props.model as CrossModelRoot);

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
            <Tabs defaultIndex={1}>
                <TabList>
                    <Tab>
                        <h3>General</h3>
                    </Tab>
                    <Tab>
                        <h3>Attributes</h3>
                    </Tab>
                    <Tab>
                        <h3>Mapping</h3>
                    </Tab>
                </TabList>

                <ModelContext.Provider value={model}>
                    <ModelDispatchContext.Provider value={dispatch}>
                        <UpdateModelContext.Provider value={props.updateModel}>
                            <TabPanel>
                                <GeneralTab />
                            </TabPanel>
                            <TabPanel>
                                <EntityAttributesTab />
                            </TabPanel>
                            <TabPanel>
                                <MappingsTab />
                            </TabPanel>
                        </UpdateModelContext.Provider>
                    </ModelDispatchContext.Provider>
                </ModelContext.Provider>
            </Tabs>
        </div>
    );
}

function GeneralTab(props: any): React.ReactElement {
    const model = React.useContext(ModelContext);
    const dispatch = React.useContext(ModelDispatchContext);
    const updateModel = React.useContext(UpdateModelContext);

    if (model.entity === undefined) {
        return <></>;
    }

    return (
        <form className='form-editor-general'>
            <div>
                <label>Name:</label>
                <ControlledInput
                    className='theia-input'
                    value={model.entity.name}
                    onChange={(e: any) => {
                        dispatch({ type: 'change-name', name: e.target.value });
                        updateModel(model);
                    }}
                />
            </div>

            <div>
                <label>Stereotype:</label>
                <ControlledInput
                    className='theia-input'
                    onChange={(e: any) => {
                        // props.entity.description = e.target.value;
                        // props.updateModel(e);
                    }}
                />
            </div>

            <div>
                <label>Description:</label>
                <ControlledTextArea
                    className='theia-input'
                    value={model.entity.description}
                    rows={4}
                    onChange={(e: any) => {
                        dispatch({ type: 'change-description', description: e.target.value });
                        updateModel(model);
                    }}
                />
            </div>
        </form>
    );
}

function MappingsTab(props: any): React.ReactElement {
    return (
        <div>
            <h1>TODO</h1>
        </div>
    );
}

function ControlledInput(props: any): React.ReactElement {
    const { value, onChange, ...rest } = props;
    const [cursor, setCursor] = React.useState(undefined);
    const ref = React.useRef<any>(undefined);

    React.useEffect(() => {
        const input = ref.current;
        if (input) {
            input.setSelectionRange(cursor, cursor);
        }
    }, [ref, cursor, value]);

    const handleChange = (e: any): void => {
        setCursor(e.target.selectionStart);
        if (onChange) {
            onChange(e);
        }
    };

    return <input ref={ref} value={value} onChange={handleChange} {...rest} />;
}

function ControlledTextArea(props: any): React.ReactElement {
    const { value, onChange, ...rest } = props;
    const [cursor, setCursor] = React.useState(undefined);
    const ref = React.useRef<any>(undefined);

    React.useEffect(() => {
        const input: any = ref.current;
        if (input) {
            input.setSelectionRange(cursor, cursor);
        }
    }, [ref, cursor, value]);

    const handleChange = (e: any): void => {
        setCursor(e.target.selectionStart);
        if (onChange) {
            onChange(e);
        }
    };

    return <textarea ref={ref} value={value} onChange={handleChange} {...rest} />;
}
