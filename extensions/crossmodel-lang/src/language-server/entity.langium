import 'terminals'

// Entity definition 
Entity:
    'entity' ':'
        INDENT
            'id' ':' id=ID
            ('name' ':'  name=STRING)?
            ('description' ':' description=STRING)?
            ('attributes' ':'
                INDENT 
                    ('-' attributes+=EntityAttribute)+
                DEDENT
            )?
        DEDENT
;

interface Attribute {
    id: string;
    name: string;
    datatype: string; 
    description?: string;
}

interface EntityAttribute extends Attribute {}

EntityAttribute returns EntityAttribute:
    'id' ':' id=ID
    'name' ':'  name=STRING
    'datatype' ':' datatype=STRING
    ('description' ':' description=STRING)?;
