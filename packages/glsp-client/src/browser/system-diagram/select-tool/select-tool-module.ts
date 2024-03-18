/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import {
   FeatureModule,
   RankedSelectMouseListener,
   SelectAllCommand,
   SelectCommand,
   SelectFeedbackCommand,
   TYPES,
   bindAsService,
   configureCommand
} from '@eclipse-glsp/client';
import { SystemSelectTool } from './select-tool';

export const systemSelectModule = new FeatureModule((bind, _unbind, isBound) => {
   const context = { bind, isBound };
   configureCommand(context, SelectCommand);
   configureCommand(context, SelectAllCommand);
   configureCommand(context, SelectFeedbackCommand);
   bindAsService(context, TYPES.IDefaultTool, SystemSelectTool);
   bind(RankedSelectMouseListener).toSelf().inSingletonScope();
});
