/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { GEdge, GGraph, GLabel, GModelFactory, GNode } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { DiagramEdge, DiagramNode } from '../../language-server/generated/ast';
import { CrossModelState } from './cross-model-state';

@injectable()
export class CrossModelGModelFactory implements GModelFactory {
   @inject(CrossModelState) protected readonly modelState: CrossModelState;

   createModel(): void {
      const newRoot = this.createGraph();
      if (newRoot) {
         this.modelState.updateRoot(newRoot);
      }
   }

   protected createGraph(): GGraph | undefined {
      const diagramRoot = this.modelState.diagramRoot;
      const graphBuilder = GGraph.builder().id(this.modelState.id);
      diagramRoot.nodes.map(node => this.createDiagramNode(node)).forEach(node => graphBuilder.add(node));
      diagramRoot.edges.map(edge => this.createDiagramEdge(edge)).forEach(edge => graphBuilder.add(edge));
      return graphBuilder.build();
   }

   protected createDiagramNode(node: DiagramNode): GNode {
      const label = GLabel.builder()
         .text(node.semanticElement.ref?.name || 'unresolved')
         .id(`${node.name}_label`)
         .build();

      return GNode.builder()
         .id(node.name)
         .addCssClasses('diagram-node', 'entity')
         .add(label)
         .layout('hbox')
         .size(node.width, node.height)
         .position(node.x, node.y)
         .addLayoutOption('paddingLeft', 5)
         .build();
   }

   protected createDiagramEdge(edge: DiagramEdge): GEdge {
      return GEdge.builder()
         .id(edge.name)
         .addCssClasses('diagram-edge', 'relationship')
         .sourceId(edge.source.ref!.name)
         .targetId(edge.target.ref!.name)
         .build();
   }
}
