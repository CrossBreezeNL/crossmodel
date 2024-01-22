/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AddSourceObjectOperation } from '@crossbreeze/protocol';
import { LabeledAction } from '@eclipse-glsp/protocol';
import { Args, CommandPaletteActionProvider, GModelElement, Point } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { AstNodeDescription } from 'langium';
import { codiconCSSString } from 'sprotty';
import { PackageExternalAstNodeDescription, isExternalDescriptionForLocalPackage } from '../../../language-server/cross-model-scope.js';
import { createSourceObjectReference } from '../../../language-server/util/ast-util.js';
import { MappingModelState } from '../model/mapping-model-state.js';

@injectable()
export class MappingDiagramCommandPaletteActionProvider extends CommandPaletteActionProvider {
   @inject(MappingModelState) protected state!: MappingModelState;

   getPaletteActions(_selectedElementIds: string[], _selectedElements: GModelElement[], position: Point, args?: Args): LabeledAction[] {
      const scopeProvider = this.state.services.language.references.ScopeProvider;
      const refInfo = createSourceObjectReference(this.state.mapping);
      const actions: LabeledAction[] = [];
      const scope = scopeProvider.getScope(refInfo);
      const duplicateStore = new Set<string>();

      const externalTargetId = this.state.idProvider.getExternalId(this.state.mapping.target.entity.ref);
      const localTargetId = this.state.idProvider.getLocalId(this.state.mapping.target.entity.ref);
      scope.getAllElements().forEach(description => {
         if (
            !duplicateStore.has(description.name) &&
            !isExternalDescriptionForLocalPackage(description, this.state.packageId) &&
            !this.isTargetDescription(description, localTargetId, externalTargetId)
         ) {
            actions.push({
               label: description.name,
               actions: [AddSourceObjectOperation.create(description.name, position || Point.ORIGIN)],
               icon: codiconCSSString('inspect')
            });
            duplicateStore.add(description.name);
         }
      });
      return actions;
   }

   protected isTargetDescription(description: AstNodeDescription, localTargetName?: string, externalTargetName?: string): boolean {
      return description instanceof PackageExternalAstNodeDescription
         ? !!externalTargetName && description.name === externalTargetName
         : !!localTargetName && description.name === localTargetName;
   }
}
