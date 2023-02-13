/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { AstNode } from 'langium';

export interface Serializer<T extends AstNode> {
   serialize(model: T): string;
}

export interface DiagramSerializer<T extends AstNode> extends Serializer<T> {
   asDiagram(model: T): string;
}
