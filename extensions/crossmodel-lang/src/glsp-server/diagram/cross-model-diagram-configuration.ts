/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { DefaultTypes, DiagramConfiguration, getDefaultMapping, ServerLayoutKind } from '@eclipse-glsp/server';
import { injectable } from 'inversify';

@injectable()
export class CrossModelDiagramConfiguration implements DiagramConfiguration {
   layoutKind = ServerLayoutKind.MANUAL;
   needsClientLayout = true;
   animatedUpdate = true;

   typeMapping = getDefaultMapping();
   shapeTypeHints = [
      {
         elementTypeId: DefaultTypes.NODE,
         deletable: true,
         reparentable: false,
         repositionable: true,
         resizable: true
      }
   ];
   edgeTypeHints = [
      {
         elementTypeId: DefaultTypes.EDGE,
         deletable: true,
         repositionable: false,
         routable: false,
         sourceElementTypeIds: [DefaultTypes.NODE],
         targetElementTypeIds: [DefaultTypes.NODE]
      }
   ];
}
