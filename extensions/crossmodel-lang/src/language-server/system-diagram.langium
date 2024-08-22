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
                    (LIST_ITEM nodes+=EntityNode)+
                DEDENT
            )?
            ('edges' ':'
                INDENT 
                    (LIST_ITEM edges+=RelationshipEdge)+
                DEDENT
            )?
            CustomProperties?
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
    CustomProperties?
;

interface EntityNodeAttribute extends EntityAttribute, WithCustomProperties {
}

RelationshipEdge:
    'id' ':' id=ID
    'relationship' ':' relationship=[Relationship:IDReference]
    'sourceNode' ':' sourceNode=[EntityNode:IDReference]
    'targetNode' ':' targetNode=[EntityNode:IDReference]
    CustomProperties?
;