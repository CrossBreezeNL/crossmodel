/********************************************************************************
 * Copyright (c) 2025 CrossBreeze.
 ********************************************************************************/

import { CustomProperty, DataModelDependency, unreachable } from '@crossmodel/protocol';
import { DispatchAction, ModelAction, ModelState, moveDown, moveUp, undefinedIfEmpty } from './ModelReducer';

export interface DataModelChangeIdAction extends ModelAction {
   type: 'datamodel:change-id';
   id: string;
}

export interface DataModelChangeNameAction extends ModelAction {
   type: 'datamodel:change-name';
   name: string;
}

export interface DataModelChangeDescriptionAction extends ModelAction {
   type: 'datamodel:change-description';
   description: string;
}

export interface DataModelChangeTypeAction extends ModelAction {
   type: 'datamodel:change-type';
   dataModelType: string;
}

export interface DataModelChangeVersionAction extends ModelAction {
   type: 'datamodel:change-version';
   version: string;
}

export interface DataModelDependencyUpdateAction extends ModelAction {
   type: 'datamodel:dependency:update';
   dependencyIdx: number;
   dependency: DataModelDependency;
}

export interface DataModelDependencyAddAction extends ModelAction {
   type: 'datamodel:dependency:add-dependency';
   dependency: DataModelDependency;
}

export interface DataModelDependencyMoveUpAction extends ModelAction {
   type: 'datamodel:dependency:move-dependency-up';
   dependencyIdx: number;
}

export interface DataModelDependencyMoveDownAction extends ModelAction {
   type: 'datamodel:dependency:move-dependency-down';
   dependencyIdx: number;
}

export interface DataModelDependencyDeleteAction extends ModelAction {
   type: 'datamodel:dependency:delete-dependency';
   dependencyIdx: number;
}

export interface CustomPropertyUpdateAction extends ModelAction {
   type: 'datamodel:customProperty:update';
   customPropertyIdx: number;
   customProperty: CustomProperty;
}

export interface CustomPropertyAddEmptyAction extends ModelAction {
   type: 'datamodel:customProperty:add-customProperty';
   customProperty: CustomProperty;
}

export interface CustomPropertyMoveUpAction extends ModelAction {
   type: 'datamodel:customProperty:move-customProperty-up';
   customPropertyIdx: number;
}

export interface CustomPropertyMoveDownAction extends ModelAction {
   type: 'datamodel:customProperty:move-customProperty-down';
   customPropertyIdx: number;
}

export interface CustomPropertyDeleteAction extends ModelAction {
   type: 'datamodel:customProperty:delete-customProperty';
   customPropertyIdx: number;
}

export type DataModelDispatchAction =
   | DataModelChangeIdAction
   | DataModelChangeNameAction
   | DataModelChangeDescriptionAction
   | DataModelChangeTypeAction
   | DataModelChangeVersionAction
   | DataModelDependencyUpdateAction
   | DataModelDependencyAddAction
   | DataModelDependencyMoveUpAction
   | DataModelDependencyMoveDownAction
   | DataModelDependencyDeleteAction
   | CustomPropertyUpdateAction
   | CustomPropertyAddEmptyAction
   | CustomPropertyMoveUpAction
   | CustomPropertyMoveDownAction
   | CustomPropertyDeleteAction;

export function isDataModelDispatchAction(action: DispatchAction): action is DataModelDispatchAction {
   return action.type.startsWith('datamodel:');
}

export function DataModelReducer(state: ModelState, action: DataModelDispatchAction): ModelState {
   const dataModel = (state.model as any).datamodel;
   if (dataModel === undefined) {
      throw Error('Model error: DataModel action applied on undefined datamodel');
   }

   state.reason = action.type;

   switch (action.type) {
      case 'datamodel:change-id':
         dataModel.id = action.id;
         break;
      case 'datamodel:change-name':
         dataModel.name = undefinedIfEmpty(action.name);
         break;
      case 'datamodel:change-description':
         dataModel.description = undefinedIfEmpty(action.description);
         break;
      case 'datamodel:change-type':
         dataModel.type = action.dataModelType;
         break;
      case 'datamodel:change-version':
         dataModel.version = undefinedIfEmpty(action.version);
         break;

      case 'datamodel:dependency:update':
         if (!dataModel.dependencies) {
            dataModel.dependencies = [];
         }
         dataModel.dependencies[action.dependencyIdx] = action.dependency;
         break;

      case 'datamodel:dependency:add-dependency':
         if (!dataModel.dependencies) {
            dataModel.dependencies = [];
         }
         dataModel.dependencies.push(action.dependency);
         break;

      case 'datamodel:dependency:delete-dependency':
         if (dataModel.dependencies) {
            dataModel.dependencies.splice(action.dependencyIdx, 1);
         }
         break;

      case 'datamodel:dependency:move-dependency-up':
         if (dataModel.dependencies) {
            moveUp(dataModel.dependencies, action.dependencyIdx);
         }
         break;

      case 'datamodel:dependency:move-dependency-down':
         if (dataModel.dependencies) {
            moveDown(dataModel.dependencies, action.dependencyIdx);
         }
         break;

      case 'datamodel:customProperty:update':
         dataModel.customProperties![action.customPropertyIdx] = {
            ...action.customProperty,
            name: undefinedIfEmpty(action.customProperty.name),
            description: undefinedIfEmpty(action.customProperty.description)
         };
         break;

      case 'datamodel:customProperty:add-customProperty':
         dataModel.customProperties!.push(action.customProperty);
         break;

      case 'datamodel:customProperty:delete-customProperty':
         dataModel.customProperties!.splice(action.customPropertyIdx, 1);
         break;

      case 'datamodel:customProperty:move-customProperty-up':
         moveUp(dataModel.customProperties!, action.customPropertyIdx);
         break;

      case 'datamodel:customProperty:move-customProperty-down':
         moveDown(dataModel.customProperties!, action.customPropertyIdx);
         break;

      default:
         unreachable(action);
   }
   return state;
}
