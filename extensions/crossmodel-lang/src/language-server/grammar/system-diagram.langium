import 'terminals'
import 'common'
import 'entity'
import 'relationship'

// Diagram definition
interface SystemDiagram extends IdentifiedObject {
    nodes: EntityNode[];
    edges: SystemDiagramEdge[];
}

SystemDiagram returns SystemDiagram:
    ('systemDiagram' | 'diagram') ':' 
    INDENT
        IdentifiedObjectFragment
        ('nodes' ':'
            INDENT 
                (LIST_ITEM nodes+=EntityNode)+
            DEDENT
        )?
        ('edges' ':'
            INDENT 
                (LIST_ITEM edges+=SystemDiagramEdge)+
            DEDENT
        )?
    DEDENT
;

interface EntityNode extends IdentifiedObject {
    entity: @Entity;
    x: number;
    y: number;
    width: number;
    height: number;
}

EntityNode returns EntityNode:
    IdentifiedObjectFragment
    'entity' ':' entity=[Entity:IDReference]
    'x' ':' x=NUMBER
    'y' ':' y=NUMBER
    'width' ':' width=NUMBER
    'height' ':' height=NUMBER
;

interface EntityNodeAttribute extends LogicalAttribute {
}

interface SystemDiagramEdge extends IdentifiedObject {}

SystemDiagramEdge returns SystemDiagramEdge:
    RelationshipEdge | InheritanceEdge
;

interface RelationshipEdge extends SystemDiagramEdge {
    relationship: @Relationship;
    sourceNode: @EntityNode;
    targetNode: @EntityNode;
}

RelationshipEdge returns RelationshipEdge:
    IdentifiedObjectFragment
    'relationship' ':' relationship=[Relationship:IDReference]
    'sourceNode' ':' sourceNode=[EntityNode:IDReference]
    'targetNode' ':' targetNode=[EntityNode:IDReference]
;

interface InheritanceEdge extends SystemDiagramEdge {
    baseNode: @EntityNode;
    superNode: @EntityNode;
}

InheritanceEdge returns InheritanceEdge:
    'id' ':' id=ID
    'baseNode' ':' baseNode=[EntityNode:IDReference]
    'superNode' ':' superNode=[EntityNode:IDReference]
;
