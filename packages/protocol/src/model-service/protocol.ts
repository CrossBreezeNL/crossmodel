/********************************************************************************
 * Copyright (c) 2023 CrossBreeze.
 ********************************************************************************/
import * as rpc from 'vscode-jsonrpc/node';

export const CrossModelRegex = {
   STRING: /^"[^"]*"$|^'[^']*'$/,
   NUMBER: /^(-)?[0-9]+(\.[0-9]*)?$/,
   SL_COMMENT: /^#[^\n\r]*$/,
   ID: /^[_a-zA-Z][\w_\-~$#@/\d$]*$/
};

/**
 * Serialized version of the semantic model generated by Langium.
 */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Reference<T> = string;

export interface CrossModelElement {
   readonly $type: string;
}

export interface IdentifiedObject {
   id: string;
   $globalId: string;
}

export interface NamedObject extends IdentifiedObject {
   name?: string;
   description?: string;
}

export interface WithCustomProperties {
   customProperties?: Array<CustomProperty>;
}

export interface CustomProperty extends NamedObject {
   value?: string;
}

export interface CrossModelDocument<T = CrossModelRoot, D = ModelDiagnostic> {
   uri: string;
   root: T;
   diagnostics: D[];
}

export interface CrossModelRoot extends CrossModelElement {
   readonly $type: 'CrossModelRoot';
   entity?: LogicalEntity;
   relationship?: Relationship;
   mapping?: Mapping;
   systemDiagram?: SystemDiagram;
}

export type RootObjectType = Exclude<CrossModelRoot[keyof CrossModelRoot], string | undefined>;
export type RootObjectTypeName = RootObjectType['$type'];

export function isCrossModelRoot(model?: any): model is CrossModelRoot {
   return !!model && model.$type === 'CrossModelRoot';
}

export const LogicalEntityType = 'LogicalEntity';
export interface LogicalEntity extends CrossModelElement, NamedObject, WithCustomProperties {
   readonly $type: typeof LogicalEntityType;
   attributes: Array<LogicalAttribute>;
   identifiers: Array<LogicalIdentifier>;
}

export const LogicalIdentifierType = 'LogicalIdentifier';
export interface LogicalIdentifier extends CrossModelElement, NamedObject, WithCustomProperties {
   primary?: boolean;
   attributes: Array<LogicalAttribute>;
}

export interface AbstractLogicalAttribute extends CrossModelElement, NamedObject {
   datatype?: string;
   identifier?: boolean;
}

export const LogicalAttributeType = 'LogicalAttribute';
export interface LogicalAttribute extends CrossModelElement, AbstractLogicalAttribute {
   readonly $type: typeof LogicalAttributeType;
}

export const RelationshipType = 'Relationship';
export interface Relationship extends CrossModelElement, NamedObject, WithCustomProperties {
   readonly $type: typeof RelationshipType;
   attributes: Array<RelationshipAttribute>;
   parent?: Reference<LogicalEntity>;
   parentCardinality?: string;
   child?: Reference<LogicalEntity>;
   childCardinality?: string;
}

export const RelationshipAttributeType = 'RelationshipAttribute';
export interface RelationshipAttribute extends CrossModelElement, WithCustomProperties {
   readonly $type: typeof RelationshipAttributeType;
   parent?: Reference<LogicalAttribute>;
   child?: Reference<LogicalAttribute>;
}

export const MappingType = 'Mapping';
export interface Mapping extends CrossModelElement, IdentifiedObject, WithCustomProperties {
   readonly $type: typeof MappingType;
   sources: Array<SourceObject>;
   target: TargetObject;
}

export const SourceObjectType = 'SourceObject';
export type SourceObjectJoinType = 'from' | 'inner-join' | 'cross-join' | 'left-join' | 'apply';
export interface SourceObject extends CrossModelElement, IdentifiedObject, WithCustomProperties {
   readonly $type: typeof SourceObjectType;
   entity?: Reference<LogicalEntity>;
   join?: SourceObjectJoinType;
   dependencies: Array<SourceObjectDependency>;
   conditions: Array<SourceObjectCondition>;
}

export const SourceObjectDependencyType = 'SourceObjectDependency';
export interface SourceObjectDependency extends CrossModelElement {
   readonly $type: typeof SourceObjectDependencyType;
   source: Reference<SourceObject>;
}

export type SourceObjectCondition = JoinCondition;

export const JoinConditionType = 'JoinCondition';
export interface JoinCondition extends CrossModelElement {
   readonly $type: typeof JoinConditionType;
   expression: BinaryExpression;
}

export const BinaryExpressionType = 'BinaryExpression';
export interface BinaryExpression extends CrossModelElement {
   readonly $type: typeof BinaryExpressionType;
   left: BooleanExpression;
   op: '!=' | '<' | '<=' | '=' | '>' | '>=';
   right: BooleanExpression;
}

export type BooleanExpression = NumberLiteral | SourceObjectAttributeReference | StringLiteral;

export const NumberLiteralType = 'NumberLiteral';
export interface NumberLiteral extends CrossModelElement {
   readonly $type: typeof NumberLiteralType;
   value: number;
}

export const StringLiteralType = 'StringLiteral';
export interface StringLiteral extends CrossModelElement {
   readonly $type: typeof StringLiteralType;
   value: string;
}

export const SourceObjectAttributeReferenceType = 'SourceObjectAttributeReference';
export interface SourceObjectAttributeReference extends CrossModelElement {
   readonly $type: typeof SourceObjectAttributeReferenceType;
   value: Reference<SourceObjectAttribute>;
}

export const TargetObjectType = 'TargetObject';
export interface TargetObject extends CrossModelElement, WithCustomProperties {
   readonly $type: typeof TargetObjectType;
   entity?: Reference<LogicalEntity>;
   mappings: Array<AttributeMapping>;
}

export const AttributeMappingType = 'AttributeMapping';
export interface AttributeMapping extends CrossModelElement, WithCustomProperties {
   readonly $type: typeof AttributeMappingType;
   attribute?: AttributeMappingTarget;
   sources: Array<AttributeMappingSource>;
   expression?: string;
}

export const AttributeMappingTargetType = 'AttributeMappingTarget';
export interface AttributeMappingTarget extends CrossModelElement {
   readonly $type: typeof AttributeMappingTargetType;
   value?: Reference<AbstractLogicalAttribute>;
}

export const TargetObjectAttributeType = 'TargetObjectAttribute';
export interface TargetObjectAttribute extends AbstractLogicalAttribute, WithCustomProperties {
   readonly $type: typeof TargetObjectAttributeType;
}

export const AttributeMappingSourceType = 'AttributeMappingSource';
export interface AttributeMappingSource extends CrossModelElement {
   readonly $type: typeof AttributeMappingSourceType;
   value: Reference<AbstractLogicalAttribute>;
}

export const SourceObjectAttributeType = 'SourceObjectAttribute';
export interface SourceObjectAttribute extends AbstractLogicalAttribute, WithCustomProperties {
   readonly $type: typeof SourceObjectAttributeType;
}

export const SystemDiagramType = 'SystemDiagram';
export interface SystemDiagram extends CrossModelElement, IdentifiedObject, WithCustomProperties {
   readonly $container: CrossModelRoot;
   readonly $type: typeof SystemDiagramType;
   edges: Array<Edge>;
   nodes: Array<EntityNode>;
}

export type Edge = InheritanceEdge | RelationshipEdge;
export const EdgeType = 'Edge';

export const InheritanceEdgeType = 'InheritanceEdge';
export interface InheritanceEdge extends CrossModelElement, IdentifiedObject, WithCustomProperties {
   readonly $container: SystemDiagram;
   readonly $type: typeof InheritanceEdgeType;
   baseNode: Reference<EntityNode>;
   superNode: Reference<EntityNode>;
}

export const RelationshipEdgeType = 'RelationshipEdge';
export interface RelationshipEdge extends CrossModelElement, IdentifiedObject, WithCustomProperties {
   readonly $container: SystemDiagram;
   readonly $type: typeof RelationshipEdgeType;
   relationship: Reference<Relationship>;
   sourceNode: Reference<EntityNode>;
   targetNode: Reference<EntityNode>;
}

export const EntityNodeType = 'EntityNode';
export interface EntityNode extends CrossModelElement, IdentifiedObject, WithCustomProperties {
   readonly $container: SystemDiagram;
   readonly $type: typeof EntityNodeType;
   entity: Reference<LogicalEntity>;
   height: number;
   name?: string;
   width: number;
   x: number;
   y: number;
}

export interface ClientModelArgs {
   uri: string;
   clientId: string;
}

export interface OpenModelArgs extends ClientModelArgs {
   languageId?: string;
   version?: number;
}

export interface CloseModelArgs extends ClientModelArgs {}

export interface UpdateModelArgs<T = CrossModelRoot> extends ClientModelArgs {
   model: T | string;
}

export interface SaveModelArgs<T = CrossModelRoot> extends ClientModelArgs {
   model: T | string;
}

export interface ModelDiagnostic {
   type: 'lexing-error' | 'parsing-error' | 'validation-error';
   message: string;
   severity: 'error' | 'warning' | 'info';
}

export namespace ModelDiagnostic {
   export function isError(diagnostic: ModelDiagnostic): boolean {
      return diagnostic.severity === 'error';
   }

   export function isParseError(diagnostic: ModelDiagnostic): boolean {
      return diagnostic.type === 'parsing-error';
   }

   export function errors(diagnostics: ModelDiagnostic[]): ModelDiagnostic[] {
      return diagnostics.filter(isError);
   }

   export function hasErrors(diagnostics: ModelDiagnostic[]): boolean {
      return diagnostics.some(isError);
   }

   export function hasParseErrors(diagnostics: ModelDiagnostic[]): boolean {
      return diagnostics.some(isParseError);
   }
}

export interface ModelUpdatedEvent<D = CrossModelDocument> {
   document: D;
   sourceClientId: string;
   reason: 'changed' | 'deleted' | 'updated' | 'saved';
}

export interface ModelSavedEvent<D = CrossModelDocument> {
   document: D;
   sourceClientId: string;
}

/**
 * A context to describe a cross reference to retrieve reachable elements.
 */
export interface CrossReferenceContext {
   /**
    * The container from which we want to query the reachable elements.
    */
   container: CrossReferenceContainer;
   /**
    * Synthetic elements starting from the container to further narrow down the cross reference.
    * This is useful for elements that are being created or if the element cannot be identified.
    */
   syntheticElements?: SyntheticElement[];
   /**
    * The property of the element referenced through the source container and the optional synthetic
    * elements for which we should retrieve the reachable elements.
    */
   property: string;
}
export interface RootElementReference {
   uri: string;
}
export function isRootElementReference(object: unknown): object is RootElementReference {
   return !!object && typeof object === 'object' && 'uri' in object && typeof object.uri === 'string';
}
export interface GlobalElementReference {
   globalId: string;
   type?: string;
}
export function isGlobalElementReference(object: unknown): object is GlobalElementReference {
   return !!object && typeof object === 'object' && 'globalId' in object && typeof object.globalId === 'string';
}
export interface SyntheticDocument {
   uri: string;
   type: string;
}
export function isSyntheticDocument(object: unknown): object is SyntheticDocument {
   return (
      !!object &&
      typeof object === 'object' &&
      'uri' in object &&
      typeof object.uri === 'string' &&
      'type' in object &&
      typeof object.type === 'string'
   );
}
export type CrossReferenceContainer = RootElementReference | GlobalElementReference | SyntheticDocument;

export interface SyntheticElement {
   type: string;
   property: string;
}
export function isSyntheticElement(object: unknown): object is SyntheticElement {
   return (
      !!object &&
      typeof object === 'object' &&
      'type' in object &&
      typeof object.type === 'string' &&
      'property' in object &&
      typeof object.property === 'string'
   );
}
export interface ReferenceableElement {
   uri: string;
   type: string;
   label: string;
}

export interface CrossReference {
   /**
    * The container from which we want to resolve the reference.
    */
   container: CrossReferenceContainer;
   /**
    * The property for which we want to resolve the reference.
    */
   property: string;
   /**
    * The textual value of the reference we are resolving.
    */
   value: string;
}

export interface ResolvedElement {
   uri: string;
   model: CrossModelRoot;
}

export interface SystemInfoArgs {
   contextUri: string;
}

export interface SystemInfo {
   id: string;
   name: string;
   type: string;
   directory: string;
   packageFilePath: string;
   modelFilePaths: string[];
}

export interface SystemUpdatedEvent {
   system: SystemInfo;
   reason: 'added' | 'removed';
}
export type SystemUpdateListener = (event: SystemUpdatedEvent) => void | Promise<void>;

export const OpenModel = new rpc.RequestType1<OpenModelArgs, CrossModelDocument | undefined, void>('server/open');
export const CloseModel = new rpc.RequestType1<CloseModelArgs, void, void>('server/close');
export const RequestModel = new rpc.RequestType1<string, CrossModelDocument | undefined, void>('server/request');
export const RequestModelDiagramNode = new rpc.RequestType2<string, string, Element | undefined, void>('server/requestModelDiagramNode');

export const FindReferenceableElements = new rpc.RequestType1<CrossReferenceContext, ReferenceableElement[], void>('server/complete');
export const ResolveReference = new rpc.RequestType1<CrossReference, ResolvedElement | undefined, void>('server/resolve');

export const UpdateModel = new rpc.RequestType1<UpdateModelArgs, CrossModelDocument, void>('server/update');
export const SaveModel = new rpc.RequestType1<SaveModelArgs, void, void>('server/save');
export const OnModelSaved = new rpc.NotificationType1<ModelSavedEvent>('server/onSave');
export const OnModelUpdated = new rpc.NotificationType1<ModelUpdatedEvent>('server/onUpdated');

export const RequestSystemInfos = new rpc.RequestType1<void, SystemInfo[], void>('server/systems');
export const RequestSystemInfo = new rpc.RequestType1<SystemInfoArgs, SystemInfo | undefined, void>('server/system');
export const OnSystemsUpdated = new rpc.NotificationType1<SystemUpdatedEvent>('server/onSystemsUpdated');

export const ModelMemberPermissions = {
   logical: ['LogicalEntity', 'Mapping', 'Relationship', 'SystemDiagram'],
   relational: []
} as const satisfies Record<string, readonly RootObjectTypeName[]>;

export function isMemberPermittedInModel(packageType: string, memberType: string): boolean {
   const permittedTypes = ModelMemberPermissions[packageType as keyof typeof ModelMemberPermissions] as readonly string[] | undefined;
   return !!permittedTypes?.includes(memberType);
}
