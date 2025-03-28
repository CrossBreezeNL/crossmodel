/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { SOURCE_NUMBER_NODE_TYPE, SOURCE_STRING_NODE_TYPE, TARGET_OBJECT_NODE_TYPE, isLeftPortId } from '@crossbreeze/protocol';
import { GCompartment, GModelRoot, GNode, GPort, LayoutEngine, MaybePromise, findParentByClass } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { getOwner } from '../../language-server/util/ast-util.js';
import { MappingModelState } from './model/mapping-model-state.js';
import { GTargetObjectNode } from './model/nodes.js';

/**
 * Manual implementation until we have Elk Layouting properly working in this scenario.
 * It seems that the combination of VS Code extension within Theia causes problems for this to work as otherwise it does.
 */
@injectable()
export class MappingDiagramLayoutEngine implements LayoutEngine {
   @inject(MappingModelState) protected modelState!: MappingModelState;

   layout(): MaybePromise<GModelRoot> {
      if (!this.modelState.mapping) {
         return this.modelState.root;
      }

      const index = this.modelState.index;

      // position source nodes in correct order
      let offset = 0;
      let maxSourceWidth = 0;
      const marginBetweenSourceNodes = 20;
      const marginBetweenSourceAndTarget = 300;
      const sourceNodes = index.getAllByClass(GNode).filter(node => node.type !== TARGET_OBJECT_NODE_TYPE);
      [...sourceNodes].sort(this.getSourceNodeOrderFunction()).forEach(node => {
         node.position = { x: 0, y: offset };
         maxSourceWidth = Math.max(maxSourceWidth, node.size.width);
         offset += node.size.height + marginBetweenSourceNodes;
      });

      // position target node vertically centered
      const targetNode = index.getAllByClass(GTargetObjectNode)[0];
      targetNode.position = {
         x: maxSourceWidth + marginBetweenSourceAndTarget,
         y: offset / 2 - targetNode.size.height / 2 - marginBetweenSourceNodes
      };

      // position ports to left and right side of parent whose size is given by the label
      index.getAllByClass(GPort).forEach(port => {
         const attributeCompartmentSize = findParentByClass(port, GCompartment)?.size;
         if (attributeCompartmentSize) {
            const portX = isLeftPortId(port.id) ? 0 : attributeCompartmentSize.width;
            port.position = { x: portX, y: attributeCompartmentSize.height / 2 };
         }
      });

      return this.modelState.root;
   }

   protected getSourceNodeOrderFunction(): (left: GNode, right: GNode) => number {
      // sort mappings by the target attribute order and extract the source node id
      const target = this.modelState.mapping.target;

      const idx = this.modelState.index;
      const sourceNodeOrder = [...target.mappings]
         .sort((left, right) => (left.attribute?.value.ref?.$containerIndex ?? 0) - (right.attribute?.value.ref?.$containerIndex ?? 0))
         .flatMap(mapping => mapping.sources.map(source => idx.createId(getOwner(source.value.ref))));
      return (left: GNode, right: GNode): number => {
         if (!sourceNodeOrder.includes(left.id)) {
            return 1;
         }
         if (!sourceNodeOrder.includes(right.id)) {
            return -1;
         }
         const compare = sourceNodeOrder.indexOf(left.id) - sourceNodeOrder.indexOf(right.id);
         if (compare !== 0) {
            return compare;
         }
         if (left.type === SOURCE_STRING_NODE_TYPE || left.type === SOURCE_NUMBER_NODE_TYPE) {
            return 1;
         }
         return 0;
      };
   }
}
