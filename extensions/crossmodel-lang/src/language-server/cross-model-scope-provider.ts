/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import {
   CrossReference,
   CrossReferenceContainer,
   CrossReferenceContext,
   ReferenceableElement,
   isGlobalElementReference,
   isRootElementReference,
   isSyntheticDocument
} from '@crossbreeze/protocol';
import {
   AstNode,
   AstNodeDescription,
   DefaultScopeProvider,
   EMPTY_SCOPE,
   ReferenceInfo,
   Scope,
   StreamScope,
   URI,
   getDocument
} from 'langium';
import { CrossModelServices } from './cross-model-module.js';
import { GlobalAstNodeDescription, PackageAstNodeDescription } from './cross-model-scope.js';
import { isAttributeMapping, isRelationshipAttribute, isSourceObject, isSourceObjectAttributeReference } from './generated/ast.js';
import { fixDocument } from './util/ast-util.js';

/**
 * A custom scope provider that considers the dependencies between packages to indicate which elements form the global scope
 * are actually available from a certain document.
 */
export class PackageScopeProvider extends DefaultScopeProvider {
   constructor(
      protected services: CrossModelServices,
      protected packageManager = services.shared.workspace.PackageManager,
      protected idProvider = services.references.IdProvider
   ) {
      super(services);
   }

   /**
    * Returns the package identifier for the given description.
    *
    * @param description node description
    * @returns package identifier
    */
   protected getPackageId(description: AstNodeDescription): string {
      return description instanceof PackageAstNodeDescription
         ? description.packageId
         : this.packageManager.getPackageIdByUri(description.documentUri);
   }

   protected override getGlobalScope(referenceType: string, context: ReferenceInfo): Scope {
      if (isAttributeMapping(context.container)) {
         // target attribute mappings should only access the local scope
         return EMPTY_SCOPE;
      }

      // the global scope contains all elements known to the language server
      const globalScope = super.getGlobalScope(referenceType, context);

      // see from which package this request is coming from based on the given context
      const source = getDocument(context.container);
      const sourcePackage = this.packageManager.getPackageIdByUri(source.uri);

      // dependencyScope: hide those elements from the global scope that are not visible from the requesting package
      const dependencyScope = new StreamScope(
         globalScope
            .getAllElements()
            .filter(
               description =>
                  description instanceof GlobalAstNodeDescription &&
                  this.packageManager.isVisible(sourcePackage, this.getPackageId(description))
            )
      );

      // create a package-local scope that is considered first with the dependency scope being considered second
      // i.e., we build a hierarchy of scopes
      const packageScope = new StreamScope(
         globalScope.getAllElements().filter(description => sourcePackage === this.getPackageId(description)),
         dependencyScope
      );

      return packageScope;
   }
}

export class CrossModelScopeProvider extends PackageScopeProvider {
   protected resolveCrossReferenceContainer(container: CrossReferenceContainer): AstNode | undefined {
      if (isSyntheticDocument(container)) {
         const document = this.services.shared.workspace.LangiumDocuments.createEmptyDocument(URI.parse(container.uri));
         return { $type: container.type, $container: document.parseResult.value };
      }
      if (isRootElementReference(container)) {
         return this.services.shared.workspace.IndexManager.resolveSemanticElement(URI.parse(container.uri));
      }
      if (isGlobalElementReference(container)) {
         return this.services.shared.workspace.IndexManager.resolveElementById(container.globalId, container.type);
      }
      return undefined;
   }

   referenceContextToInfo(ctx: CrossReferenceContext): ReferenceInfo {
      let container = this.resolveCrossReferenceContainer(ctx.container);
      if (!container) {
         throw Error('Invalid CrossReference Container');
      }
      for (const segment of ctx.syntheticElements ?? []) {
         container = {
            ...segment,
            $container: container,
            $containerProperty: segment.property,
            $type: segment.type
         };
      }
      const referenceInfo: ReferenceInfo = {
         reference: { $refText: '' },
         container: container,
         property: ctx.property
      };
      return referenceInfo;
   }

   resolveCrossReference(reference: CrossReference): AstNode | undefined {
      const description = this.getScope(this.referenceContextToInfo(reference))
         .getAllElements()
         .find(desc => desc.name === reference.value);
      return this.services.shared.workspace.IndexManager.resolveElement(description);
   }

   override getScope(context: ReferenceInfo): Scope {
      try {
         return super.getScope(this.fixContext(context));
      } catch (error) {
         return EMPTY_SCOPE;
      }
   }

   protected fixContext(context: ReferenceInfo): ReferenceInfo {
      // for some reason the document is not always properly set on the container node
      fixDocument(context.container, context.container.$cstNode?.root.astNode.$document);
      return context;
   }

   getCompletionScope(ctx: CrossReferenceContext): CompletionScope {
      const referenceInfo = this.referenceContextToInfo(ctx);
      const packageId = this.packageManager.getPackageIdByDocument(getDocument(referenceInfo.container));
      const filteredDescriptions = this.getScope(referenceInfo)
         .getAllElements()
         .filter(description => this.filterCompletion(description, packageId, referenceInfo.container, referenceInfo.property))
         .distinct(description => description.name);
      const elementScope = this.createScope(filteredDescriptions);
      return { elementScope, source: referenceInfo };
   }

   complete(ctx: CrossReferenceContext): ReferenceableElement[] {
      return this.getCompletionScope(ctx)
         .elementScope.getAllElements()
         .map<ReferenceableElement>(description => ({
            uri: description.documentUri.toString(),
            type: description.type,
            label: description.name
         }))
         .toArray()
         .sort((left, right) => left.label.localeCompare(right.label));
   }

   filterCompletion(description: AstNodeDescription, packageId: string, container?: AstNode, property?: string): boolean {
      if (isRelationshipAttribute(container)) {
         // only show relevant attributes depending on the parent or child context
         if (property === 'child') {
            return description.name.startsWith(container.$container.child?.$refText + '.');
         }
         if (property === 'parent') {
            return description.name.startsWith(container.$container.parent?.$refText + '.');
         }
      }
      if (isSourceObject(container) && property === 'entity' && container.$container.target.entity.ref) {
         const targetEntity = container.$container.target.entity.ref;
         if (description instanceof GlobalAstNodeDescription) {
            return description.name !== this.idProvider.getGlobalId(targetEntity);
         }
         return description.name !== this.idProvider.getLocalId(targetEntity);
      }
      if (isSourceObjectAttributeReference(container)) {
         // we are in a join condition of a source object, only show our own and our dependent source object references
         const dependency = container.$container.$container.$container;
         const sourceObject = dependency.$container;
         return description.name.startsWith(dependency.source.$refText + '.') || description.name.startsWith(sourceObject.id + '.');
      }
      return true;
   }
}

export interface CompletionScope {
   source: ReferenceInfo;
   elementScope: Scope;
}
