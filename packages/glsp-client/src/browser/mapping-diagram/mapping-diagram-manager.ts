/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { codiconCSSString } from '@eclipse-glsp/client';
import { GLSPDiagramManager } from '@eclipse-glsp/theia-integration';
import { URI } from '@theia/core';
import { OpenWithHandler, OpenWithService, WidgetOpenerOptions } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { MappingDiagramLanguage } from '../../common/crossmodel-diagram-language';

export interface ProblemMarkerOpenerOptions extends WidgetOpenerOptions {
   selection?: Range;
}

@injectable()
export class MappingDiagramManager extends GLSPDiagramManager implements OpenWithHandler {
   @inject(OpenWithService) protected readonly openWithService: OpenWithService;

   @postConstruct()
   protected override init(): void {
      this.openWithService.registerHandler(this);
      super.init();
   }

   get label(): string {
      return MappingDiagramLanguage.label;
   }

   override get iconClass(): string {
      return MappingDiagramLanguage.iconClass ?? codiconCSSString('type-hierarchy-sub');
   }

   override get fileExtensions(): string[] {
      return MappingDiagramLanguage.fileExtensions;
   }

   override get diagramType(): string {
      return MappingDiagramLanguage.diagramType;
   }

   override get contributionId(): string {
      return MappingDiagramLanguage.contributionId;
   }

   override canHandle(uri: URI, options?: ProblemMarkerOpenerOptions | undefined): number {
      if (options?.selection) {
         return 0;
      }
      return super.canHandle(uri, options);
   }
}
