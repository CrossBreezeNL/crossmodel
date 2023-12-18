import 'terminals'
import 'entity'
import 'relationship'

// Diagram defintion
SystemDiagram:
    'diagram' ':' 
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
        (nodes+=DiagramNode)*     
    DEDENT
;

DiagramNode:
    '-' DiagramNodeFields*
;

DiagramNodeFields infers DiagramNode:
    'id' ':' id=ID | 
    'entity' ':' entity=[Entity:IDReference] |
    'x' ':' x=NUMBER | 
    'y' ':' y=NUMBER |
    'width' ':' width=NUMBER |
    'height' ':' height=NUMBER |
    'name' ':'  name=STRING |
    'description' ':' description=STRING
;

SystemDiagramEdge infers SystemDiagram:
    INDENT 
        (edges+=DiagramEdge)*     
    DEDENT
;

DiagramEdge:
    '-' DiagramEdgeFields*
;

DiagramEdgeFields infers DiagramEdge:
    (
        'relationship' ':' relationship=[Relationship:IDReference] |
        'sourceNode' ':' sourceNode=[DiagramNode:IDReference] |
        'targetNode' ':' targetNode=[DiagramNode:IDReference] |
        'id' ':' id=ID
    )
;