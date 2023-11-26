/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { GModelIndex } from '@eclipse-glsp/server';
import { inject, injectable } from 'inversify';
import { AstNode, streamAst } from 'langium';
import { CrossModelLSPServices } from '../../integration.js';
import {
   CrossModelRoot,
   DiagramEdge,
   DiagramNode,
   Entity,
   Relationship,
   isDiagramEdge,
   isDiagramNode,
   isEntity,
   isRelationship
} from '../../language-server/generated/ast.js';

/**
 * Custom model index that not only indexes the GModel elements but also the semantic elements (AstNodes) they represent.
 */
@injectable()
export class CrossModelIndex extends GModelIndex {
   @inject(CrossModelLSPServices) services!: CrossModelLSPServices;

   protected idToSemanticNode = new Map<string, AstNode>();

   createId(node?: AstNode): string | undefined {
      return this.services.language.references.IdProvider.getNodeId(node);
   }

   indexSemanticRoot(root: CrossModelRoot): void {
      this.idToSemanticNode.clear();
      streamAst(root).forEach(node => this.indexAstNode(node));
   }

   protected indexAstNode(node: AstNode): void {
      const id = this.createId(node);
      if (id) {
         this.idToSemanticNode.set(id, node);
      }
   }

   findEntity(id: string): Entity | undefined {
      return this.findSemanticElement(id, isEntity);
   }

   findRelationship(id: string): Relationship | undefined {
      return this.findSemanticElement(id, isRelationship);
   }

   findDiagramNode(id: string): DiagramNode | undefined {
      return this.findSemanticElement(id, isDiagramNode);
   }

   findDiagramEdge(id: string): DiagramEdge | undefined {
      return this.findSemanticElement(id, isDiagramEdge);
   }

   findSemanticElement<T extends AstNode>(id: string, guard: (item: unknown) => item is T): T | undefined {
      const semanticNode = this.idToSemanticNode.get(id);
      return guard(semanticNode) ? semanticNode : undefined;
   }
}
