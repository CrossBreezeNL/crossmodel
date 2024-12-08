import 'terminals'
import 'entity'

// Relationship definition
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
                    (LIST_ITEM attributes+=RelationshipAttribute)+
                DEDENT
            )?
            CustomProperties?
        DEDENT
;
 
RelationshipAttribute:
    'parent' ':' parent=[Attribute:IDReference]
    'child' ':' child=[Attribute:IDReference]
    CustomProperties?
;
