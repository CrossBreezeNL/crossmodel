import 'terminals'
import 'common'

interface Entity extends DataElementContainer, WithCustomProperties {
    superEntities: @Entity[]
    attributes: EntityAttribute[]
}

// Entity definition 
Entity returns Entity:
    'entity' ':'
        INDENT
            NamedObjectFragment
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
            CustomPropertiesFragment?
        DEDENT
;

interface EntityAttribute extends DataElement, WithCustomProperties {
    length?: number;
    precision?: number;
    scale?: number;
    identifier?: boolean;
}

EntityAttribute returns EntityAttribute:
    NamedObjectFragment
    ('datatype' ':' datatype=STRING)?
    ('length' ':' length=NUMBER)?
    ('precision' ':' precision=NUMBER)?
    ('scale' ':' scale=NUMBER)?
    (identifier?='identifier' ':' ('TRUE' | 'true'))?
    CustomPropertiesFragment?
;
