/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AddEntityOperation } from '@crossbreeze/protocol';
import { EditorContext, LabeledAction } from '@eclipse-glsp/protocol';
import { ContextActionsProvider, Point } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { codiconCSSString } from 'sprotty';
import { isExternalDescriptionForLocalPackage } from '../../language-server/cross-model-scope';
import { createNodeToEntityReference } from '../../language-server/util/ast-util';
import { CrossModelState } from '../model/cross-model-state';

@injectable()
export class CrossModelAddEntityActionProvider implements ContextActionsProvider {
   contextId = 'command-palette';

   @inject(CrossModelState) protected state: CrossModelState;

   async getActions(editorContext: EditorContext): Promise<LabeledAction[]> {
      const scopeProvider = this.state.services.language.references.ScopeProvider;
      const refInfo = createNodeToEntityReference(this.state.diagramRoot);
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
