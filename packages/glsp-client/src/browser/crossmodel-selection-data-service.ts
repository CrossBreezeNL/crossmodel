/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { CrossReference, REFERENCE_CONTAINER_TYPE, REFERENCE_PROPERTY, REFERENCE_VALUE } from '@crossbreeze/protocol';
import { GModelElement, GModelRoot, hasArgs } from '@eclipse-glsp/client';
import { GlspSelectionData } from '@eclipse-glsp/theia-integration';
import { isDefined } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { CrossModelSelectionDataService } from './crossmodel-selection-forwarder';

@injectable()
export class CrossModelGLSPSelectionDataService extends CrossModelSelectionDataService {
   async getSelectionData(root: Readonly<GModelRoot>, selectedElementIds: string[]): Promise<GlspSelectionData> {
      return getSelectionDataFor(selectedElementIds.map(id => root.index.getById(id)).filter(isDefined));
   }
}

export interface GModelElementInfo {
   type: string;
   reference?: CrossReference;
}

export interface CrossModelSelectionData {
   selectionDataMap: Map<string, GModelElementInfo>;
}

export function getSelectionDataFor(selection: GModelElement[]): CrossModelSelectionData {
   const selectionDataMap = new Map<string, GModelElementInfo>();
   selection.forEach(element => selectionDataMap.set(element.id, getElementInfo(element)));
   return { selectionDataMap };
}

export function getElementInfo(element: GModelElement): GModelElementInfo {
   if (hasArgs(element)) {
      const referenceProperty = element.args[REFERENCE_PROPERTY];
      const referenceContainerType = element.args[REFERENCE_CONTAINER_TYPE];
      const referenceValue = element.args[REFERENCE_VALUE];
      if (referenceProperty && referenceContainerType && referenceValue) {
         return {
            type: element.type,
            reference: {
               container: { globalId: element.id, type: referenceContainerType.toString() },
               property: referenceProperty.toString(),
               value: referenceValue.toString()
            }
         };
      }
   }
   return { type: element.type };
}
