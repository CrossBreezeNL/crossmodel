/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { GLSPMouseTool, RankedSelectMouseListener, Tool } from '@eclipse-glsp/client';
import { inject, injectable } from '@theia/core/shared/inversify';

@injectable()
export class SystemSelectTool implements Tool {
   static ID = 'tool_system_select';

   id = SystemSelectTool.ID;
   isEditTool = false;

   @inject(GLSPMouseTool) protected mouseTool: GLSPMouseTool;
   @inject(RankedSelectMouseListener) protected listener: RankedSelectMouseListener;

   enable(): void {
      this.mouseTool.registerListener(this.listener);
   }

   disable(): void {
      this.mouseTool.deregister(this.listener);
   }
}
