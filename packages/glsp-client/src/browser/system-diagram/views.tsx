/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/

import { GEdgeView } from '@eclipse-glsp/client';
import { injectable } from 'inversify';
import { DiagramNodeView } from '../views';

@injectable()
export class EntityNodeView extends DiagramNodeView {}

@injectable()
export class RelationshipEdgeView extends GEdgeView {}
