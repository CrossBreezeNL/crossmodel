import 'terminals'

// Entity definition 
Entity:
    'entity' ':'
    (
        INDENT
        (
            'id' ':' id=ID |
            'name' ':'  name=STRING |
            'description' ':' description=STRING |
            'attributes' ':' EntityAttributes
        )*
        DEDENT
    )*
;

interface Attribute {
    id: string;
    name?: string;
    description?: string;
    datatype: string;
}

interface EntityAttribute extends Attribute {}

EntityAttributes infers Entity:
    INDENT 
        (attributes+=EntityAttribute)*     
    DEDENT;

EntityAttribute returns EntityAttribute:
    '-' (
        'id' ':' id=ID |
        'name' ':'  name=STRING |
        'datatype' ':' datatype=STRING |
        'description' ':' description=STRING
    )*
;
