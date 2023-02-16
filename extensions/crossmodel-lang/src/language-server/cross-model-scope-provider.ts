/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AstNodeDescription, DefaultScopeProvider, getDocument, ReferenceInfo, Scope, StreamScope } from 'langium';
import { CrossModelServices } from './cross-model-module';
import { CrossModelWorkspaceManager } from './cross-model-workspace-manager';

class WorkspaceFolderScopeProvider extends DefaultScopeProvider {
   protected readonly workspaceManager: CrossModelWorkspaceManager;

   constructor(protected services: CrossModelServices) {
      super(services);
      this.workspaceManager = services.shared.workspace.WorkspaceManager;
   }

   protected override getGlobalScope(referenceType: string, context: ReferenceInfo): Scope {
      const contextUri = getDocument(context.container).uri;
      const globalScope = super.getGlobalScope(referenceType, context);
      const filter = (desc: AstNodeDescription): boolean => this.workspaceManager.areInSameWorkspace(desc.documentUri, contextUri);
      return new StreamScope(globalScope.getAllElements().filter(filter));
   }
}

export class CrossModelScopeProvider extends WorkspaceFolderScopeProvider {}
