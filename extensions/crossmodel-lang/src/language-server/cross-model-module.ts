/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import {
   createDefaultModule,
   createDefaultSharedModule,
   DefaultSharedModuleContext,
   inject,
   LangiumServices,
   LangiumSharedServices,
   Module,
   PartialLangiumServices,
   PartialLangiumSharedServices
} from 'langium';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { AddedSharedModelServices, ModelServices } from '../model-server/model-module';
import { ModelService } from '../model-server/model-service';
import { OpenTextDocumentManager } from '../model-server/open-text-document-manager';
import { OpenableTextDocuments } from '../model-server/openable-text-documents';
import { DiagramSerializer } from '../model-server/serializer';
import { ClientLogger } from './cross-model-client-logger';
import { CrossModelModelFormatter } from './cross-model-formatter';
import { QualifiedNameProvider } from './cross-model-naming';
import { CrossModelScopeComputation } from './cross-model-scope';
import { CrossModelScopeProvider } from './cross-model-scope-provider';
import { CrossModelSerializer } from './cross-model-serializer';
import { CrossModelValidator, registerValidationChecks } from './cross-model-validator';
import { CrossModelWorkspaceManager } from './cross-model-workspace-manager';
import { CrossModelRoot } from './generated/ast';
import { CrossModelGeneratedModule, CrossModelGeneratedSharedModule } from './generated/module';

/***************************
 * Shared Module
 ***************************/

/**
 * Declaration of custom services - add your own service classes here.
 */
export interface CrossModelAddedSharedServices {
   workspace: {
      /* override */ WorkspaceManager: CrossModelWorkspaceManager;
   };
   logger: {
      ClientLogger: ClientLogger;
   };
}

export const CrossModelSharedServices = Symbol('CrossModelSharedServices');
export type CrossModelSharedServices = LangiumSharedServices & CrossModelAddedSharedServices & AddedSharedModelServices;

export const CrossModelSharedModule: Module<
   CrossModelSharedServices,
   PartialLangiumSharedServices & CrossModelAddedSharedServices & AddedSharedModelServices
> = {
   workspace: {
      WorkspaceManager: services => new CrossModelWorkspaceManager(services),
      TextDocuments: () => new OpenableTextDocuments(TextDocument),
      TextDocumentManager: services => new OpenTextDocumentManager(services)
   },
   logger: {
      ClientLogger: services => new ClientLogger(services)
   }
};

/***************************
 * Language Module
 ***************************/

export interface CrossModelModuleContext {
   shared: CrossModelSharedServices;
}

/**
 * Declaration of custom services - add your own service classes here.
 */
export interface CrossModelAddedServices extends ModelServices {
   references: {
      QualifiedNameProvider: QualifiedNameProvider;
   };
   validation: {
      CrossModelValidator: CrossModelValidator;
   };
   serializer: {
      Serializer: DiagramSerializer<CrossModelRoot>;
   };
   /* override */ shared: CrossModelSharedServices;
}

/**
 * Union of Langium default services and your custom services - use this as constructor parameter
 * of custom service classes.
 */
export type CrossModelServices = LangiumServices & CrossModelAddedServices;
export const CrossModelServices = Symbol('CrossModelServices');

/**
 * Dependency injection module that overrides Langium default services and contributes the
 * declared custom services. The Langium defaults can be partially specified to override only
 * selected services, while the custom services must be fully specified.
 */
export function createCrossModelModule(
   context: CrossModelModuleContext
): Module<CrossModelServices, PartialLangiumServices & CrossModelAddedServices> {
   return {
      references: {
         ScopeComputation: services => new CrossModelScopeComputation(services),
         ScopeProvider: services => new CrossModelScopeProvider(services),
         QualifiedNameProvider: () => new QualifiedNameProvider()
      },
      validation: {
         CrossModelValidator: () => new CrossModelValidator()
      },
      lsp: {
         Formatter: () => new CrossModelModelFormatter()
      },
      serializer: {
         Serializer: services => new CrossModelSerializer(services)
      },
      model: {
         ModelService: services => new ModelService(services, context.shared)
      },
      shared: () => context.shared
   };
}

/**
 * Create the full set of services required by Langium.
 *
 * First inject the shared services by merging two modules:
 *  - Langium default shared services
 *  - Services generated by langium-cli
 *
 * Then inject the language-specific services by merging three modules:
 *  - Langium default language-specific services
 *  - Services generated by langium-cli
 *  - Services specified in this file
 *
 * @param context Optional module context with the LSP connection
 * @returns An object wrapping the shared services and the language-specific services
 */
export function createCrossModelServices(context: DefaultSharedModuleContext): {
   shared: CrossModelSharedServices;
   CrossModel: CrossModelServices;
} {
   const shared = inject(createDefaultSharedModule(context), CrossModelGeneratedSharedModule, CrossModelSharedModule);
   const CrossModel = inject(createDefaultModule({ shared }), CrossModelGeneratedModule, createCrossModelModule({ shared }));
   shared.ServiceRegistry.register(CrossModel);
   registerValidationChecks(CrossModel);
   return { shared, CrossModel };
}
