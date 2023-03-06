/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AstNodeDescription, CompletionAcceptor, CompletionContext, DefaultCompletionProvider, MaybePromise, NextFeature } from 'langium';
import { CrossReference } from 'langium/lib/grammar/generated/ast';
import { CrossModelServices } from './cross-model-module';
import { PackageExternalAstNodeDescription } from './cross-model-scope';

export class CrossModelCompletionProvider extends DefaultCompletionProvider {
   protected packageId?: string;

   constructor(services: CrossModelServices, protected packageManager = services.shared.workspace.PackageManager) {
      super(services);
   }

   protected override completionForCrossReference(
      context: CompletionContext,
      crossRef: NextFeature<CrossReference>,
      acceptor: CompletionAcceptor
   ): MaybePromise<void> {
      this.packageId = this.packageManager.getPackageIdByDocument(context.document);
      try {
         super.completionForCrossReference(context, crossRef, acceptor);
      } finally {
         this.packageId = undefined;
      }
   }

   protected override filterCrossReference(description: AstNodeDescription): boolean {
      // we want to keep fully qualified names in the scope so we can do proper linking
      // but want to hide it from the user for local options, i.e., if we are in the same project we can skip the project name
      if (this.packageId && description instanceof PackageExternalAstNodeDescription && description.packageId === this.packageId) {
         return false;
      }
      return super.filterCrossReference(description);
   }
}
