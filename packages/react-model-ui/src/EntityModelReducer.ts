/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { LogicalAttribute } from '@crossbreeze/protocol';
import { DispatchAction, ModelAction, ModelState, moveDown, moveUp, undefinedIfEmpty } from './ModelReducer';

export interface EntityChangeNameAction extends ModelAction {
   type: 'entity:change-name';
   name: string;
}

export interface EntityChangeDescriptionAction extends ModelAction {
   type: 'entity:change-description';
   description: string;
}

export interface LogicalAttributeUpdateAction extends ModelAction {
   type: 'entity:attribute:update';
   attributeIdx: number;
   attribute: LogicalAttribute;
}

export interface LogicalAttributeAddEmptyAction extends ModelAction {
   type: 'entity:attribute:add-attribute';
   attribute: LogicalAttribute;
}

export interface LogicalAttributeMoveUpAction extends ModelAction {
   type: 'entity:attribute:move-attribute-up';
   attributeIdx: number;
}

export interface LogicalAttributeMoveDownAction extends ModelAction {
   type: 'entity:attribute:move-attribute-down';
   attributeIdx: number;
}

export interface LogicalAttributeDeleteAction extends ModelAction {
   type: 'entity:attribute:delete-attribute';
   attributeIdx: number;
}

export type EntityDispatchAction =
   | EntityChangeNameAction
   | EntityChangeDescriptionAction
   | LogicalAttributeUpdateAction
   | LogicalAttributeAddEmptyAction
   | LogicalAttributeMoveUpAction
   | LogicalAttributeMoveDownAction
   | LogicalAttributeDeleteAction;

export function isEntityDispatchAction(action: DispatchAction): action is EntityDispatchAction {
   return action.type.startsWith('entity:');
}

export function EntityModelReducer(state: ModelState, action: EntityDispatchAction): ModelState {
   const entity = state.model.entity;
   if (entity === undefined) {
      throw Error('Model error: Entity action applied on undefined entity');
   }

   state.reason = action.type;

   switch (action.type) {
      case 'entity:change-name':
         entity.name = undefinedIfEmpty(action.name);
         break;

      case 'entity:change-description':
         entity.description = undefinedIfEmpty(action.description);
         break;

      case 'entity:attribute:update':
         entity.attributes[action.attributeIdx] = {
            ...action.attribute,
            name: undefinedIfEmpty(action.attribute.name),
            description: undefinedIfEmpty(action.attribute.description)
         };
         break;

      case 'entity:attribute:add-attribute':
         entity.attributes.push(action.attribute);
         break;

      case 'entity:attribute:delete-attribute':
         entity.attributes.splice(action.attributeIdx, 1);
         break;

      case 'entity:attribute:move-attribute-up':
         moveUp(entity.attributes, action.attributeIdx);
         break;

      case 'entity:attribute:move-attribute-down':
         moveDown(entity.attributes, action.attributeIdx);
         break;
   }
   return state;
}
