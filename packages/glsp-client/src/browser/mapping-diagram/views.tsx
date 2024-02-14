/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
/* eslint-disable react/no-unknown-property */

import { GEdgeView } from '@eclipse-glsp/client';
import { injectable } from 'inversify';
import { DiagramNodeView } from '../views';

@injectable()
export class SourceObjectNodeView extends DiagramNodeView {}

@injectable()
export class SourceNumberNodeView extends DiagramNodeView {}

@injectable()
export class SourceStringNodeView extends DiagramNodeView {}

@injectable()
export class TargetObjectNodeView extends DiagramNodeView {}

@injectable()
export class AttributeMappingEdgeView extends GEdgeView {}
