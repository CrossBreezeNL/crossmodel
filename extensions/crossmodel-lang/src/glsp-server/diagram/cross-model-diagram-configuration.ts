/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { DefaultTypes, DiagramConfiguration, getDefaultMapping, ServerLayoutKind } from '@eclipse-glsp/server';
import { injectable } from 'inversify';

@injectable()
export class CrossModelDiagramConfiguration implements DiagramConfiguration {
   layoutKind = ServerLayoutKind.MANUAL; // we store layout information manually so no automatic layouting is necessary
   needsClientLayout = true; // require layout information from client
   animatedUpdate = true; // use animtations during state updates

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
