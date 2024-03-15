import 'terminals'
import 'entity'
import 'relationship'

// Diagram defintion
SystemDiagram:
    ('systemDiagram' | 'diagram') ':' 
    (
        INDENT
            'id' ':' id=ID
            ('name' ':'  name=STRING)?
            ('description' ':' description=STRING)?
            ('nodes' ':'
                INDENT 
                    ('-' nodes+=EntityNode)+
                DEDENT
            )?
            ('edges' ':'
                INDENT 
                    ('-' edges+=RelationshipEdge)+
                DEDENT
            )?
        DEDENT
    )*
;


EntityNode:
    'id' ':' id=ID
    ('name' ':'  name=STRING)?
    ('description' ':' description=STRING)?
    'entity' ':' entity=[Entity:IDReference]
    'x' ':' x=NUMBER
    'y' ':' y=NUMBER
    'width' ':' width=NUMBER
    'height' ':' height=NUMBER
;

interface EntityNodeAttribute extends EntityAttribute {
}

RelationshipEdge:
    'id' ':' id=ID
    'relationship' ':' relationship=[Relationship:IDReference]
    'sourceNode' ':' sourceNode=[EntityNode:IDReference]
    'targetNode' ':' targetNode=[EntityNode:IDReference]
;