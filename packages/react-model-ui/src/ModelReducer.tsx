/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AttributeMappingSource, CrossModelRoot, EntityAttribute, RelationshipAttribute } from '@crossbreeze/protocol';

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
   type: 'entity:attribute:add-attribute';
   attribute: EntityAttribute;
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

export interface AttributeMappingChangeExpressionAction extends ModelAction {
   type: 'attribute-mapping:change-expression';
   mappingIdx: number;
   expression: string;
}

export interface AttributeMappingUpdateSourceAction extends ModelAction {
   type: 'attribute-mapping:update-source';
   mappingIdx: number;
   sourceIdx: number;
   source: AttributeMappingSource;
}

export interface AttributeMappingAddEmptySourceAction extends ModelAction {
   type: 'attribute-mapping:add-source';
   mappingIdx: number;
   source: AttributeMappingSource;
}

export interface AttributeMappingMoveSourceUpAction extends ModelAction {
   type: 'attribute-mapping:move-source-up';
   mappingIdx: number;
   sourceIdx: number;
}

export interface AttributeMappingMoveSourceDownAction extends ModelAction {
   type: 'attribute-mapping:move-source-down';
   mappingIdx: number;
   sourceIdx: number;
}

export interface AttributeMappingDeleteSourceAction extends ModelAction {
   type: 'attribute-mapping:delete-source';
   mappingIdx: number;
   sourceIdx: number;
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
   | RelationshipAttributeDeleteAction
   | AttributeMappingChangeExpressionAction
   | AttributeMappingUpdateSourceAction
   | AttributeMappingAddEmptySourceAction
   | AttributeMappingMoveSourceUpAction
   | AttributeMappingMoveSourceDownAction
   | AttributeMappingDeleteSourceAction;

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

      case 'entity:attribute:add-attribute':
         state.model.entity!.attributes.push(action.attribute);
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

      case 'relationship:attribute:add-relationship':
         state.model.relationship!.attributes.push(action.attribute);
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

      case 'attribute-mapping:change-expression':
         state.model.mapping!.target.mappings[action.mappingIdx].expression = undefinedIfEmpty(action.expression);
         break;

      case 'attribute-mapping:update-source':
         state.model.mapping!.target.mappings[action.mappingIdx].sources[action.sourceIdx] = { ...action.source };
         break;

      case 'attribute-mapping:add-source':
         state.model.mapping!.target.mappings[action.mappingIdx].sources.push(action.source);
         break;

      case 'attribute-mapping:move-source-up':
         if (action.sourceIdx > 0) {
            const attributeMapping = state.model.mapping!.target.mappings[action.mappingIdx];
            const temp = attributeMapping.sources[action.sourceIdx - 1];
            attributeMapping.sources[action.sourceIdx - 1] = attributeMapping.sources[action.sourceIdx];
            attributeMapping.sources[action.sourceIdx] = temp;
         }
         break;

      case 'attribute-mapping:move-source-down':
         if (action.sourceIdx < state.model.mapping!.target.mappings[action.mappingIdx].sources.length - 1) {
            const attributeMapping = state.model.mapping!.target.mappings[action.mappingIdx];
            const temp = attributeMapping.sources[action.sourceIdx + 1];
            attributeMapping.sources[action.sourceIdx + 1] = attributeMapping.sources[action.sourceIdx];
            attributeMapping.sources[action.sourceIdx] = temp;
         }
         break;

      case 'attribute-mapping:delete-source':
         state.model.mapping!.target.mappings[action.mappingIdx].sources.splice(action.sourceIdx, 1);
         break;

      default: {
         throw Error('Unknown ModelReducer action');
      }
   }
   return state;
}

export function undefinedIfEmpty(string?: string): string | undefined {
   return valueIfEmpty(string, undefined);
}

export function valueIfEmpty<V, T extends V | undefined>(value: V | undefined, defaultValue: T): V | T {
   return !value ? defaultValue : value;
}
