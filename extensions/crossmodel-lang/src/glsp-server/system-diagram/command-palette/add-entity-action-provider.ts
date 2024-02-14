/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AddEntityOperation } from '@crossbreeze/protocol';
import { EditorContext, LabeledAction } from '@eclipse-glsp/protocol';
import { ContextActionsProvider, ModelState, Point } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { codiconCSSString } from 'sprotty';
import { isExternalDescriptionForLocalPackage } from '../../../language-server/cross-model-scope.js';
import { createEntityNodeReference } from '../../../language-server/util/ast-util.js';
import { SystemModelState } from '../model/system-model-state.js';

/**
 * An action provider for the command palette (Ctrl+Space) to allow adding entities to an existing diagram.
 * Each action will trigger a 'AddEntityOperation' for the specific entity.
 */
@injectable()
export class SystemDiagramAddEntityActionProvider implements ContextActionsProvider {
   contextId = 'command-palette';

   @inject(ModelState) protected state!: SystemModelState;

   async getActions(editorContext: EditorContext): Promise<LabeledAction[]> {
      const scopeProvider = this.state.services.language.references.ScopeProvider;
      const refInfo = createEntityNodeReference(this.state.systemDiagram);
      const actions: LabeledAction[] = [];
      const scope = scopeProvider.getScope(refInfo);
      const duplicateStore = new Set<string>();

      scope.getAllElements().forEach(description => {
         if (!duplicateStore.has(description.name) && !isExternalDescriptionForLocalPackage(description, this.state.packageId)) {
            actions.push({
               label: description.name,
               actions: [AddEntityOperation.create(description.name, editorContext.lastMousePosition || Point.ORIGIN)],
               icon: codiconCSSString('inspect')
            });
            duplicateStore.add(description.name);
         }
      });

      return actions;
   }
}
