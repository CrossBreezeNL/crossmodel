import 'terminals'
import 'common'

interface Entity extends DataContainer, WithCustomProperties {
    superEntities: @Entity[]
    attributes: EntityAttribute[]
}

// Entity definition 
Entity returns Entity:
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

interface Attribute extends DataElement {
}

interface EntityAttribute extends Attribute, WithCustomProperties {
    length: number;
    precision: number;
    scale: number;
    identifier?: boolean;
}

EntityAttribute returns EntityAttribute:
    'id' ':' id=ID
    'name' ':'  name=STRING
    'datatype' ':' datatype=STRING
    'length' ':' length=NUMBER
    'precision' ':' precision=NUMBER
    'scale' ':' scale=NUMBER
    (identifier?='identifier' ':' ('TRUE' | 'true'))?
    ('description' ':' description=STRING)?
    CustomProperties?;
