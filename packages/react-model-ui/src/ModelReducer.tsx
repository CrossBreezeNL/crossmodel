/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { CrossModelRoot } from '@crossbreeze/protocol';

export interface ModelAction {
    type: string;
}

export interface ModelUpdateAction extends ModelAction {
    type: 'model:update';
    model: CrossModelRoot;
}

export interface EntityChangeNameAction extends ModelAction {
    type: 'entity:change-name';
    name: string;
}

export interface EntityChangeDescriptionAction extends ModelAction {
    type: 'entity:change-description';
    description: string;
}

export interface EntityAttributeChangeNameAction extends ModelAction {
    type: 'entity:attribute:change-name';
    attributeIdx: number;
    name: string;
}

export interface EntityAttributeChangeDatatypeAction extends ModelAction {
    type: 'entity:attribute:change-datatype';
    attributeIdx: number;
    datatype: string;
}

export interface EntityAttributeAddEmptyAction extends ModelAction {
    type: 'entity:attribute:add-empty';
}

export interface EntityAttributeMoveUpAction extends ModelAction {
    type: 'entity:attribute:move-attribute-up';
    attributeIdx: number;
}

export interface EntityAttributeMoveDownAction extends ModelAction {
    type: 'entity:attribute:move-attribute-down';
    attributeIdx: number;
}

export interface EntityAttributeDeleteAction extends ModelAction {
    type: 'entity:attribute:delete-attribute';
    attributeIdx: number;
}

export type DispatchAction =
    | ModelUpdateAction
    | EntityChangeNameAction
    | EntityChangeDescriptionAction
    | EntityAttributeChangeNameAction
    | EntityAttributeChangeDatatypeAction
    | EntityAttributeAddEmptyAction
    | EntityAttributeMoveUpAction
    | EntityAttributeMoveDownAction
    | EntityAttributeDeleteAction;

export type ModelStateReason = DispatchAction['type'] | 'model:initial';

export interface ModelState {
    model: CrossModelRoot;
    reason: ModelStateReason;
}

export function ModelReducer(state: ModelState, action: DispatchAction): ModelState {
    if (state.model === undefined) {
        throw Error('Model error: Model undefined');
    }

    if (state.model.entity === undefined && action.type.startsWith('entity:')) {
        throw Error('Model error: Entity action applied on undefined entity');
    }

    state.reason = action.type;

    switch (action.type) {
        case 'model:update':
            state.model = action.model;
            break;

        case 'entity:change-name':
            state.model.entity!.name = action.name;
            break;

        case 'entity:change-description':
            state.model.entity!.description = action.description;
            break;

        case 'entity:attribute:change-datatype':
            state.model.entity!.attributes[action.attributeIdx].datatype = action.datatype;
            break;

        case 'entity:attribute:change-name':
            state.model.entity!.attributes[action.attributeIdx].name_val = action.name;
            break;

        case 'entity:attribute:add-empty':
            state.model.entity!.attributes.push({
                $type: 'EntityAttribute',
                name: `empty_attribute${state.model.entity!.attributes.length}`,
                datatype: 'Float'
            });
            break;

        case 'entity:attribute:move-attribute-up':
            if (action.attributeIdx > 0) {
                const temp = state.model.entity!.attributes[action.attributeIdx - 1];
                state.model.entity!.attributes[action.attributeIdx - 1] = state.model.entity!.attributes[action.attributeIdx];
                state.model.entity!.attributes[action.attributeIdx] = temp;
            }
            break;

        case 'entity:attribute:move-attribute-down':
            if (action.attributeIdx < state.model.entity!.attributes.length - 1) {
                const temp = state.model.entity!.attributes[action.attributeIdx + 1];
                state.model.entity!.attributes[action.attributeIdx + 1] = state.model.entity!.attributes[action.attributeIdx];
                state.model.entity!.attributes[action.attributeIdx] = temp;
            }
            break;

        case 'entity:attribute:delete-attribute':
            state.model.entity!.attributes.splice(action.attributeIdx, 1);
            break;
        default: {
            throw Error('Unknown ModelReducer action');
        }
    }
    return state;
}
