/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { SourceObject, SourceObjectDependency, SourceObjectDependencyCondition, SourceObjectJoinType } from '@crossbreeze/protocol';
import { DispatchAction, ModelAction, ModelState, moveDown, moveUp } from './ModelReducer';

export interface SourceObjectChangeJoinAction extends ModelAction {
   type: 'source-object:change-join';
   sourceObjectIdx: number;
   join: SourceObjectJoinType;
}

export interface SourceObjectUpdateDependencyAction extends ModelAction {
   type: 'source-object:update-dependency';
   sourceObjectIdx: number;
   dependencyIdx: number;
   dependency: SourceObjectDependency;
}

export interface SourceObjectAddDependencyAction extends ModelAction {
   type: 'source-object:add-dependency';
   sourceObjectIdx: number;
   dependency: SourceObjectDependency;
}

export interface SourceObjectDeleteDependencyAction extends ModelAction {
   type: 'source-object:delete-dependency';
   sourceObjectIdx: number;
   dependencyIdx: number;
}

export interface SourceObjectMoveDependencyUpAction extends ModelAction {
   type: 'source-object:move-dependency-up';
   sourceObjectIdx: number;
   dependencyIdx: number;
}

export interface SourceObjectMoveDependencyDownAction extends ModelAction {
   type: 'source-object:move-dependency-down';
   sourceObjectIdx: number;
   dependencyIdx: number;
}

export interface SourceObjectDependencyUpdateConditionAction extends ModelAction {
   type: 'source-object:dependency:update-condition';
   sourceObjectIdx: number;
   dependencyIdx: number;
   conditionIdx: number;
   condition: SourceObjectDependencyCondition;
}

export interface SourceObjectDependencyAddConditionAction extends ModelAction {
   type: 'source-object:dependency:add-condition';
   sourceObjectIdx: number;
   dependencyIdx: number;
   condition: SourceObjectDependencyCondition;
}

export interface SourceObjectDependencyDeleteConditionAction extends ModelAction {
   type: 'source-object:dependency:delete-condition';
   sourceObjectIdx: number;
   dependencyIdx: number;
   conditionIdx: number;
}

export interface SourceObjectDependencyMoveConditionUpAction extends ModelAction {
   type: 'source-object:dependency:move-condition-up';
   sourceObjectIdx: number;
   dependencyIdx: number;
   conditionIdx: number;
}

export interface SourceObjectDependencyMoveConditionDownAction extends ModelAction {
   type: 'source-object:dependency:move-condition-down';
   sourceObjectIdx: number;
   dependencyIdx: number;
   conditionIdx: number;
}

export type SourceObjectDependencyAction =
   | SourceObjectUpdateDependencyAction
   | SourceObjectAddDependencyAction
   | SourceObjectMoveDependencyUpAction
   | SourceObjectMoveDependencyDownAction
   | SourceObjectDeleteDependencyAction;

export type SourceObjectDependencyConditionAction =
   | SourceObjectDependencyUpdateConditionAction
   | SourceObjectDependencyAddConditionAction
   | SourceObjectDependencyDeleteConditionAction
   | SourceObjectDependencyMoveConditionUpAction
   | SourceObjectDependencyMoveConditionDownAction;

export type MappingSourcesDispatchAction =
   | SourceObjectChangeJoinAction
   | SourceObjectDependencyAction
   | SourceObjectDependencyConditionAction;

export function isMappingSourcesDispatchAction(action: DispatchAction): action is MappingSourcesDispatchAction {
   return action.type.startsWith('source-object:');
}

export function MappingSourcesModelReducer(state: ModelState, action: MappingSourcesDispatchAction): ModelState {
   const mapping = state.model.mapping;
   if (mapping === undefined) {
      throw Error('Model error: Mapping action applied on undefined mapping');
   }

   const sourceObject = mapping.sources[action.sourceObjectIdx];
   if (sourceObject === undefined) {
      throw Error('Model error: Mapping action applied on undefined source object');
   }
   switch (action.type) {
      case 'source-object:change-join':
         sourceObject.join = action.join;
         break;

      case 'source-object:update-dependency':
         sourceObject.dependencies[action.dependencyIdx] = action.dependency;
         break;

      case 'source-object:add-dependency':
         sourceObject.dependencies.push(action.dependency);
         break;

      case 'source-object:move-dependency-up':
         moveUp(sourceObject.dependencies, action.dependencyIdx);
         break;

      case 'source-object:move-dependency-down':
         moveDown(sourceObject.dependencies, action.dependencyIdx);
         break;

      case 'source-object:delete-dependency':
         sourceObject.dependencies.splice(action.dependencyIdx, 1);
         break;

      case 'source-object:dependency:update-condition':
      case 'source-object:dependency:add-condition':
      case 'source-object:dependency:delete-condition':
      case 'source-object:dependency:move-condition-up':
      case 'source-object:dependency:move-condition-down':
         handleSourceObjectDependencyCondition(sourceObject, action);
         break;
   }
   return state;
}

function handleSourceObjectDependencyCondition(sourceObject: SourceObject, action: SourceObjectDependencyConditionAction): void {
   const dependency = sourceObject.dependencies[action.dependencyIdx];
   if (dependency === undefined) {
      throw Error('Model error: Mapping action applied on undefined dependency object');
   }
   switch (action.type) {
      case 'source-object:dependency:update-condition':
         dependency.conditions[action.conditionIdx] = action.condition;
         break;
      case 'source-object:dependency:add-condition':
         dependency.conditions.push(action.condition);
         break;
      case 'source-object:dependency:delete-condition':
         dependency.conditions.splice(action.conditionIdx, 1);
         break;
      case 'source-object:dependency:move-condition-up':
         moveUp(dependency.conditions, action.conditionIdx);
         break;
      case 'source-object:dependency:move-condition-down':
         moveDown(dependency.conditions, action.conditionIdx);
         break;
   }
}
