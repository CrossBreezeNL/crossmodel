/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import { AstNode, LangiumDocument, Reference, ReferenceInfo, findRootNode } from 'langium';
import { DiagramNode, SystemDiagram } from '../generated/ast.js';

export function createNodeToEntityReference(root: SystemDiagram): ReferenceInfo {
   return {
      reference: {} as Reference,
      container: {
         $type: DiagramNode,
         $container: root,
         $containerProperty: 'nodes'
      },
      property: 'entity'
   };
}

/**
 * Retrieve the document in which the given AST node is contained. A reference to the document is
 * usually held by the root node of the AST.
 *
 * @throws an error if the node is not contained in a document.
 */
export function findDocument<T extends AstNode = AstNode>(node: AstNode): LangiumDocument<T> | undefined {
   const rootNode = findRootNode(node);
   const result = rootNode.$document;
   return result ? <LangiumDocument<T>>result : undefined;
}
