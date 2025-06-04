/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { RelationshipAttribute, unreachable } from '@crossmodel/protocol';
import { DispatchAction, ModelAction, ModelState, moveDown, moveUp, undefinedIfEmpty } from './ModelReducer';

export interface RelationshipChangeNameAction extends ModelAction {
   type: 'relationship:change-name';
   name: string;
}

export interface RelationshipChangeIdAction extends ModelAction {
   type: 'relationship:change-id';
   id: string;
}

export interface RelationshipChangeDescriptionAction extends ModelAction {
   type: 'relationship:change-description';
   description: string;
}

export interface RelationshipChangeParentAction extends ModelAction {
   type: 'relationship:change-parent';
   parent?: string;
}

export interface RelationshipChangeParentCardinalityAction extends ModelAction {
   type: 'relationship:change-parent-cardinality';
   parentCardinality: string;
}

export interface RelationshipChangeChildAction extends ModelAction {
   type: 'relationship:change-child';
   child?: string;
}

export interface RelationshipChangeChildCardinalityAction extends ModelAction {
   type: 'relationship:change-child-cardinality';
   childCardinality: string;
}

export interface RelationshipAttributeUpdateAction extends ModelAction {
   type: 'relationship:attribute:update';
   attributeIdx: number;
   attribute: RelationshipAttribute;
}

export interface RelationshipAttributeAddEmptyAction extends ModelAction {
   type: 'relationship:attribute:add-relationship';
   attribute: RelationshipAttribute;
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

export type RelationshipDispatchAction =
   | RelationshipChangeNameAction
   | RelationshipChangeIdAction
   | RelationshipChangeDescriptionAction
   | RelationshipChangeParentAction
   | RelationshipChangeParentCardinalityAction
   | RelationshipChangeChildAction
   | RelationshipChangeChildCardinalityAction
   | RelationshipAttributeUpdateAction
   | RelationshipAttributeAddEmptyAction
   | RelationshipAttributeMoveUpAction
   | RelationshipAttributeMoveDownAction
   | RelationshipAttributeDeleteAction;

export function isRelationshipDispatchAction(action: DispatchAction): action is RelationshipDispatchAction {
   return action.type.startsWith('relationship:');
}

export function RelationshipModelReducer(state: ModelState, action: RelationshipDispatchAction): ModelState {
   const relationship = state.model.relationship;
   if (relationship === undefined) {
      throw Error('Model error: Relationship action applied on undefined relationship');
   }

   switch (action.type) {
      case 'relationship:change-name':
         relationship.name = undefinedIfEmpty(action.name);
         break;

      case 'relationship:change-id':
         relationship.id = action.id;
         break;

      case 'relationship:change-description':
         relationship.description = undefinedIfEmpty(action.description);
         break;

      case 'relationship:change-parent':
         relationship.parent = action.parent;
         break;

      case 'relationship:change-parent-cardinality':
         relationship.parentCardinality = undefinedIfEmpty(action.parentCardinality);
         break;

      case 'relationship:change-child':
         relationship.child = action.child;
         break;

      case 'relationship:change-child-cardinality':
         relationship.childCardinality = undefinedIfEmpty(action.childCardinality);
         break;

      case 'relationship:attribute:update':
         relationship.attributes[action.attributeIdx] = action.attribute;
         break;

      case 'relationship:attribute:add-relationship':
         relationship.attributes.push(action.attribute);
         break;

      case 'relationship:attribute:move-attribute-up':
         moveUp(relationship.attributes, action.attributeIdx);
         break;

      case 'relationship:attribute:move-attribute-down':
         moveDown(relationship.attributes, action.attributeIdx);
         break;

      case 'relationship:attribute:delete-attribute':
         relationship.attributes.splice(action.attributeIdx, 1);
         break;
      default:
         return unreachable(action);
   }
   return state;
}
