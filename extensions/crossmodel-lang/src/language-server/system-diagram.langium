import 'terminals'
import 'entity'
import 'relationship'

// Diagram definition
SystemDiagram:
    ('systemDiagram' | 'diagram') ':' 
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
                (LIST_ITEM edges+=Edge)+
            DEDENT
        )?
        CustomProperties?
    DEDENT
;

Edge:
    RelationshipEdge | InheritanceEdge
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

InheritanceEdge:
    'id' ':' id=ID
    'baseNode' ':' baseNode=[EntityNode:IDReference]
    'superNode' ':' superNode=[EntityNode:IDReference]
    CustomProperties?
;