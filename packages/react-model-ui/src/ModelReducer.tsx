/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import {
   CrossModelRoot,
   EntityAttribute,
   EntityAttributeType,
   RelationshipAttribute,
   RelationshipAttributeType
} from '@crossbreeze/protocol';

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

export interface EntityAttributeUpdateAction extends ModelAction {
   type: 'entity:attribute:update';
   attributeIdx: number;
   attribute: EntityAttribute;
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

export interface RelationshipUpdateAction extends ModelAction {
   type: 'relationship:update';
   name: string;
}

export interface RelationshipChangeNameAction extends ModelAction {
   type: 'relationship:change-name';
   name: string;
}

export interface RelationshipChangeDescriptionAction extends ModelAction {
   type: 'relationship:change-description';
   description: string;
}

export interface RelationshipChangeTypeAction extends ModelAction {
   type: 'relationship:change-type';
   newType: string;
}

export interface RelationshipChangeParentAction extends ModelAction {
   type: 'relationship:change-parent';
   parent?: string;
}

export interface RelationshipChangeChildAction extends ModelAction {
   type: 'relationship:change-child';
   child?: string;
}

export interface RelationshipAttributeUpdateAction extends ModelAction {
   type: 'relationship:attribute:update';
   attributeIdx: number;
   attribute: RelationshipAttribute;
}

export interface RelationshipAttributeAddEmptyAction extends ModelAction {
   type: 'relationship:attribute:add-empty';
}

export interface RelationshipAttributeMoveUpAction extends ModelAction {
   type: 'relationship:attribute:move-attribute-up';
   attributeIdx: number;
}

export interface RelationshipAttributeMoveDownAction extends ModelAction {
   type: 'relationship:attribute:move-attribute-down';
   attributeIdx: number;
}

export interface RelationshipAttributeDeleteAction extends ModelAction {
   type: 'relationship:attribute:delete-attribute';
   attributeIdx: number;
}

export type DispatchAction =
   | ModelUpdateAction
   | EntityChangeNameAction
   | EntityChangeDescriptionAction
   | EntityAttributeUpdateAction
   | EntityAttributeAddEmptyAction
   | EntityAttributeMoveUpAction
   | EntityAttributeMoveDownAction
   | EntityAttributeDeleteAction
   | RelationshipUpdateAction
   | RelationshipChangeNameAction
   | RelationshipChangeDescriptionAction
   | RelationshipChangeTypeAction
   | RelationshipChangeParentAction
   | RelationshipChangeChildAction
   | RelationshipAttributeUpdateAction
   | RelationshipAttributeAddEmptyAction
   | RelationshipAttributeMoveUpAction
   | RelationshipAttributeMoveDownAction
   | RelationshipAttributeDeleteAction;

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
         state.model.entity!.name = undefinedIfEmpty(action.name);
         break;

      case 'entity:change-description':
         state.model.entity!.description = undefinedIfEmpty(action.description);
         break;

      case 'entity:attribute:update':
         state.model.entity!.attributes[action.attributeIdx] = {
            ...action.attribute,
            name: undefinedIfEmpty(action.attribute.name),
            description: undefinedIfEmpty(action.attribute.description)
         };
         break;

      case 'entity:attribute:add-empty':
         state.model.entity!.attributes.push({
            $type: EntityAttributeType,
            id: findName('Attribute', state.model.entity!.attributes, attr => attr.id!),
            $globalId: 'toBeAssigned',
            name: findName('New Attribute', state.model.entity!.attributes, attr => attr.name!),
            datatype: 'Varchar'
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

      case 'relationship:change-name':
         state.model.relationship!.name = undefinedIfEmpty(action.name);
         break;

      case 'relationship:change-description':
         state.model.relationship!.description = undefinedIfEmpty(action.description);
         break;

      case 'relationship:change-type':
         state.model.relationship!.type = action.newType;
         break;

      case 'relationship:change-parent':
         state.model.relationship!.parent = action.parent;
         break;

      case 'relationship:change-child':
         state.model.relationship!.child = action.child;
         break;

      case 'relationship:attribute:update':
         state.model.relationship!.attributes[action.attributeIdx] = action.attribute;
         break;

      case 'relationship:attribute:add-empty':
         state.model.relationship!.attributes.push({
            $type: RelationshipAttributeType
         });
         break;

      case 'relationship:attribute:move-attribute-up':
         if (action.attributeIdx > 0) {
            const temp = state.model.relationship!.attributes[action.attributeIdx - 1];
            state.model.relationship!.attributes[action.attributeIdx - 1] = state.model.relationship!.attributes[action.attributeIdx];
            state.model.relationship!.attributes[action.attributeIdx] = temp;
         }
         break;

      case 'relationship:attribute:move-attribute-down':
         if (action.attributeIdx < state.model.relationship!.attributes.length - 1) {
            const temp = state.model.relationship!.attributes[action.attributeIdx + 1];
            state.model.relationship!.attributes[action.attributeIdx + 1] = state.model.relationship!.attributes[action.attributeIdx];
            state.model.relationship!.attributes[action.attributeIdx] = temp;
         }
         break;

      case 'relationship:attribute:delete-attribute':
         state.model.relationship!.attributes.splice(action.attributeIdx, 1);
         break;

      default: {
         throw Error('Unknown ModelReducer action');
      }
   }
   return state;
}

function findName<T>(suggestion: string, data: T[], nameGetter: (element: T) => string): string {
   const names = data.map(nameGetter);
   let name = suggestion;
   let index = 1;
   while (names.includes(name)) {
      name = name + index++;
   }
   return name;
}

export function undefinedIfEmpty(string?: string): string | undefined {
   return valueIfEmpty(string, undefined);
}

export function valueIfEmpty<V, T extends V | undefined>(value: V | undefined, defaultValue: T): V | T {
   return !value ? defaultValue : value;
}
