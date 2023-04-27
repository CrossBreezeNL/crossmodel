/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { GEdge, GGraph, GModelFactory, GNode } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { DiagramEdge, DiagramNode } from '../../language-server/generated/ast';
import { GEntityNode } from './builders/gentity-node';
import { CrossModelState } from './cross-model-state';

/**
 * Custom factory that translates the semantic diagram root from Langium to a GLSP graph.
 * Each semantic element in the diagram will be translated to a GModel element on the GLSP side.
 * The GLSP client will later use the GModel to render the SVG elements based on their type.
 */
@injectable()
export class CrossModelGModelFactory implements GModelFactory {
   @inject(CrossModelState) protected readonly modelState: CrossModelState;

   createModel(): void {
      const newRoot = this.createGraph();
      if (newRoot) {
         // update GLSP root element in state so it can be used in any follow-up actions/commands
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
