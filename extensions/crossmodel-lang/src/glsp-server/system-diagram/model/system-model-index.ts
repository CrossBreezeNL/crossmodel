/********************************************************************************
 * Copyright (c) 2024 CrossBreeze.
 ********************************************************************************/
import { injectable } from 'inversify';
import {
   Entity,
   EntityNode,
   Relationship,
   RelationshipEdge,
   isEntity,
   isEntityNode,
   isRelationship,
   isRelationshipEdge
} from '../../../language-server/generated/ast.js';
import { CrossModelIndex } from '../../common/cross-model-index.js';

@injectable()
export class SystemModelIndex extends CrossModelIndex {
   findEntity(id: string): Entity | undefined {
      return this.findSemanticElement(id, isEntity);
   }

   findRelationship(id: string): Relationship | undefined {
      return this.findSemanticElement(id, isRelationship);
   }

   findEntityNode(id: string): EntityNode | undefined {
      return this.findSemanticElement(id, isEntityNode);
   }

   findRelationshipEdge(id: string): RelationshipEdge | undefined {
      return this.findSemanticElement(id, isRelationshipEdge);
   }
}
