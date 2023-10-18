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
        'id' ':' name=STRING |
        'name' ':'  name_val=STRING |
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
        'id' ':' name=STRING |
        'name' ':'  name_val=STRING |
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
        'id' ':' name=STRING |
        'name' ':'  name_val=STRING |
        'description' ':' description=STRING |
        'parent' ':' parent=[Entity:QualifiedName] |
        'child' ':' child=[Entity:QualifiedName] |
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
        'id' ':' name=STRING |
        'description' ':' description=STRING |
        'name' ':'  name_val=STRING
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
    'id' ':' name=STRING | 
    'entity' ':' entity=[Entity:QualifiedName] |
    'x' ':' x=NUMBER | 
    'y' ':' y=NUMBER |
    'width' ':' width=NUMBER |
    'height' ':' height=NUMBER |
    'name' ':'  name_val=STRING |
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
        'relationship' ':' relationship=[Relationship:QualifiedName] |
        'sourceNode' ':' sourceNode=[DiagramNode:QualifiedName] |
        'targetNode' ':' targetNode=[DiagramNode:QualifiedName] |
        'id' ':' name=STRING
    )
;

// Identification
QualifiedName returns string:
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

