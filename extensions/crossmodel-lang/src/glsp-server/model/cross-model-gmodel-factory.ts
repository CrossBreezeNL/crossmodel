/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { GEdge, GGraph, GModelFactory, GNode } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { DiagramEdge, DiagramNode } from '../../language-server/generated/ast';
import { CrossModelState } from './cross-model-state';
import { GEntityNode } from './builders/GEntityNode';

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

      const graphBuilder = GGraph.builder().id(this.modelState.semanticUri);
      diagramRoot.nodes.map(node => this.createDiagramNode(node)).forEach(node => graphBuilder.add(node));
      diagramRoot.edges.map(edge => this.createDiagramEdge(edge)).forEach(edge => graphBuilder.add(edge));

      return graphBuilder.build();
   }

   protected createDiagramNode(node: DiagramNode): GNode {
      // Get the reference that the DiagramNode holds to the Entity in the .langium file.
      const id = this.modelState.index.createId(node) ?? 'unknown';
      return GEntityNode.builder().id(id).addNode(node).build();
   }

   protected createDiagramEdge(edge: DiagramEdge): GEdge {
      const id = this.modelState.index.createId(edge) ?? 'unknown';
      return GEdge.builder()
         .id(id)
         .addCssClasses('diagram-edge', 'relationship')
         .sourceId(edge.source.$refText)
         .targetId(edge.target.$refText)
         .build();
   }
}
