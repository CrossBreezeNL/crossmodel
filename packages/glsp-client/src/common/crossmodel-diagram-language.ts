/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { GLSPDiagramLanguage } from '@eclipse-glsp/theia-integration/lib/common';

export const CrossModelDiagramLanguage: GLSPDiagramLanguage = {
   contributionId: 'crossmodel-contribution',
   label: 'CrossModel Diagram',
   diagramType: 'crossmodel-diagram',
   fileExtensions: ['.diagram.cm']
};
