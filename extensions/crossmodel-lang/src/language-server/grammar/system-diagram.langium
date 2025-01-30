import 'terminals'
import 'common'
import 'entity'
import 'relationship'

// Diagram definition
interface SystemDiagram extends IdentifiedObject {
    nodes: EntityNode[];
    edges: RelationshipEdge[];
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
                (LIST_ITEM edges+=RelationshipEdge)+
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

// TODO: Why does this exist? In the system diagram we don't have attribute nodes right (in the grammar)? Or is this pure the generate an AST class to be used in the diagram for rendering?
interface EntityNodeAttribute extends EntityAttribute {
}

interface RelationshipEdge extends IdentifiedObject {
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
