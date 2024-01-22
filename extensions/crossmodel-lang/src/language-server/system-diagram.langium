import 'terminals'
import 'entity'
import 'relationship'

// Diagram defintion
SystemDiagram:
    ('systemDiagram' | 'diagram') ':' 
    (
        INDENT
            SystemDiagramFields*
        DEDENT
    )*
;

SystemDiagramFields infers SystemDiagram:
    (
        'nodes' ':' SystemDiagramNodes |
        'edges' ':' SystemDiagramEdge |
        'id' ':' id=ID |
        'description' ':' description=STRING |
        'name' ':'  name=STRING
    )
;

SystemDiagramNodes infers SystemDiagram:
    INDENT 
        (nodes+=EntityNode)*     
    DEDENT
;

EntityNode:
    '-' EntityNodeFields*
;

EntityNodeFields infers EntityNode:
    'id' ':' id=ID | 
    'entity' ':' entity=[Entity:IDReference] |
    'x' ':' x=NUMBER | 
    'y' ':' y=NUMBER |
    'width' ':' width=NUMBER |
    'height' ':' height=NUMBER |
    'name' ':'  name=STRING |
    'description' ':' description=STRING
;

interface EntityNodeAttribute extends EntityAttribute {
}

SystemDiagramEdge infers SystemDiagram:
    INDENT 
        (edges+=RelationshipEdge)*     
    DEDENT
;

RelationshipEdge:
    '-' RelationshipEdgeFields*
;

RelationshipEdgeFields infers RelationshipEdge:
    (
        'relationship' ':' relationship=[Relationship:IDReference] |
        'sourceNode' ':' sourceNode=[EntityNode:IDReference] |
        'targetNode' ':' targetNode=[EntityNode:IDReference] |
        'id' ':' id=ID
    )
;