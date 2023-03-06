/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AstNodeDescription, DefaultScopeProvider, getDocument, ReferenceInfo, Scope, StreamScope } from 'langium';
import { CrossModelServices } from './cross-model-module';
import { PackageAstNodeDescription, PackageExternalAstNodeDescription } from './cross-model-scope';

export class PackageScopeProvider extends DefaultScopeProvider {
   constructor(protected services: CrossModelServices, protected packageManager = services.shared.workspace.PackageManager) {
      super(services);
   }

   protected getPackageId(description: AstNodeDescription): string {
      return description instanceof PackageAstNodeDescription
         ? description.packageId
         : this.packageManager.getPackageIdByUri(description.documentUri);
   }

   protected override getGlobalScope(referenceType: string, context: ReferenceInfo): Scope {
      const globalScope = super.getGlobalScope(referenceType, context);

      const source = getDocument(context.container);
      const sourcePackage = this.packageManager.getPackageIdByUri(source.uri);

      const dependencyScope = new StreamScope(
         globalScope
            .getAllElements()
            .filter(
               description =>
                  description instanceof PackageExternalAstNodeDescription &&
                  this.packageManager.isVisible(sourcePackage, this.getPackageId(description))
            )
      );

      const projectScope = new StreamScope(
         globalScope.getAllElements().filter(description => sourcePackage === this.getPackageId(description)),
         dependencyScope
      );

      return projectScope;
   }
}

export class CrossModelScopeProvider extends PackageScopeProvider {}
