import 'terminals'
import 'entity'

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
        'id' ':' id=ID |
        'name' ':'  name=STRING |
        'description' ':' description=STRING |
        'parent' ':' parent=[Entity:IDReference] |
        'child' ':' child=[Entity:IDReference] |
        'type' ':' type=STRING
    )
;