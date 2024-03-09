import 'terminals'
import 'entity'

// Relationship defintion
Relationship:
    'relationship' ':' 
        INDENT
            'id' ':' id=ID
            ('name' ':'  name=STRING)?
            ('description' ':' description=STRING)?
            'parent' ':' parent=[Entity:IDReference]
            'child' ':' child=[Entity:IDReference]
            'type' ':' type=STRING
            ('attributes' ':'
                INDENT 
                    ('-' attributes+=RelationshipAttribute)+
                DEDENT
            )?
        DEDENT
;
 
RelationshipAttribute:
    'parent' ':' parent=[Attribute:IDReference]
    'child' ':' child=[Attribute:IDReference]
;
