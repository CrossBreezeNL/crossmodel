/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { GChildElement, GEdge, GModelElement, GModelRoot, MetadataPlacer, setAttr } from '@eclipse-glsp/client';
import { injectable } from '@theia/core/shared/inversify';
import { VNode } from 'snabbdom';

@injectable()
export class CmMetadataPlacer extends MetadataPlacer {
   override decorate(vnode: VNode, element: GModelElement): VNode {
      if (element instanceof GModelRoot) {
         setAttr(vnode, 'data-svg-metadata-api', true);
         setAttr(vnode, 'data-svg-metadata-revision', element.revision ?? 0);
      }

      setAttr(vnode, 'data-svg-metadata-type', element.type);

      if (element instanceof GChildElement) {
         setAttr(vnode, 'data-svg-metadata-parent-id', this.domHelper.createUniqueDOMElementId(element.parent));
      }
      if (element instanceof GEdge) {
         if (element.source !== undefined) {
            setAttr(vnode, 'data-svg-metadata-edge-source-id', this.domHelper.createUniqueDOMElementId(element.source));
         }
         if (element.target !== undefined) {
            setAttr(vnode, 'data-svg-metadata-edge-target-id', this.domHelper.createUniqueDOMElementId(element.target));
         }
      }
      return vnode;
   }
}
