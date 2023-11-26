grammar CrossModel

entry CrossModelRoot:
    (entity=Entity | 
    relationship=Relationship | 
    diagram=SystemDiagram)?;

// Entity definition 
Entity:
    'entity' ':'
    (
        INDENT
            EntityFields*
        DEDENT
    )*
;

EntityFields infers Entity:
    (
        'id' ':' id=STRING |
        'name' ':'  name=STRING |
        'description' ':' description=STRING |
        'attributes' ':' EntityAttributes
    )
;

EntityAttributes infers Entity:
    INDENT 
        (attributes+=EntityAttribute)*     
    DEDENT;

EntityAttribute:
    '-' EntityAttributeFields*
;

EntityAttributeFields infers EntityAttribute:
    (
        'id' ':' id=STRING |
        'name' ':'  name=STRING |
        'datatype' ':' datatype=STRING |
        'description' ':' description=STRING
    );

// Relationship defintion
Relationship:
    'relationship' ':' 
    (
        INDENT
            RelationshipFields*
        DEDENT
    )*
;

RelationshipFields infers Relationship:
    (
        'id' ':' id=STRING |
        'name' ':'  name=STRING |
        'description' ':' description=STRING |
        'parent' ':' parent=[Entity:Identifier] |
        'child' ':' child=[Entity:Identifier] |
        'type' ':' type=STRING
    )
;

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
        'id' ':' id=STRING |
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
    'id' ':' id=STRING | 
    'entity' ':' entity=[Entity:Identifier] |
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
        'relationship' ':' relationship=[Relationship:Identifier] |
        'sourceNode' ':' sourceNode=[DiagramNode:Identifier] |
        'targetNode' ':' targetNode=[DiagramNode:Identifier] |
        'id' ':' id=STRING
    )
;

// Identification
Identifier returns string:
    STRING ('.' STRING)*;

// Scalar values
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER returns number: /(-)?[0-9]+(\.[0-9]*)?/;

// Misc
hidden terminal SL_COMMENT: /#[^\n\r]*/;

// Terminals to get the indentation working
hidden terminal NEWLINE: 'this_string_does_not_matter_newline#$%^&*((';
terminal DEDENT: 'this_string_does_not_matter_dedent#$%^&*((';
terminal INDENT: 'this_string_does_not_matter_indent#$%^&*((';
hidden terminal SPACES: 'this_string_does_not_matter_spaces#$%^&*((';

