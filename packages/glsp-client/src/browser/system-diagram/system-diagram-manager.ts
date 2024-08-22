/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/

import { codiconCSSString } from '@eclipse-glsp/client';
import { GLSPDiagramManager } from '@eclipse-glsp/theia-integration';
import { OpenWithHandler, OpenWithService } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { SystemDiagramLanguage } from '../../common/crossmodel-diagram-language';

@injectable()
export class SystemDiagramManager extends GLSPDiagramManager implements OpenWithHandler {
   @inject(OpenWithService) protected readonly openWithService: OpenWithService;

   @postConstruct()
   protected override init(): void {
      this.openWithService.registerHandler(this);
      super.init();
   }

   get label(): string {
      return SystemDiagramLanguage.label;
   }

   override get iconClass(): string {
      return SystemDiagramLanguage.iconClass ?? codiconCSSString('type-hierarchy-sub');
   }

   override get fileExtensions(): string[] {
      return SystemDiagramLanguage.fileExtensions;
   }

   override get diagramType(): string {
      return SystemDiagramLanguage.diagramType;
   }

   override get contributionId(): string {
      return SystemDiagramLanguage.contributionId;
   }
}
