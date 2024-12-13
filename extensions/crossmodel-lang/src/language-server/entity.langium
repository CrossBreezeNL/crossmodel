import 'terminals'

// Entity definition 
Entity:
    'entity' ':'
        INDENT
            'id' ':' id=ID
            ('name' ':'  name=STRING)?
            ('description' ':' description=STRING)?
            ('inherits' ':'
                INDENT
                    (LIST_ITEM superEntities+=[Entity:IDReference])+
                DEDENT
            )?
            ('attributes' ':'
                INDENT
                    (LIST_ITEM attributes+=EntityAttribute)+
                DEDENT
            )?
            CustomProperties?
        DEDENT
;

interface Attribute {
    id: string;
    name: string;
    datatype: string;
    description?: string;
}

interface EntityAttribute extends Attribute, WithCustomProperties {
    identifier?: boolean;
}

EntityAttribute returns EntityAttribute:
    'id' ':' id=ID
    'name' ':'  name=STRING
    'datatype' ':' datatype=STRING
    (identifier?='identifier' ':' ('TRUE' | 'true'))?
    ('description' ':' description=STRING)?
    CustomProperties?;
