import 'terminals'
import 'common'

interface Entity extends DataElementContainer, WithCustomProperties {
    superEntities: @Entity[]
    attributes: LogicalAttribute[]
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
                    (LIST_ITEM attributes+=LogicalAttribute)+
                DEDENT
            )?
            CustomPropertiesFragment?
        DEDENT
;

interface LogicalAttribute extends DataElement, WithCustomProperties {
    length?: number;
    precision?: number;
    scale?: number;
    identifier?: boolean;
}

LogicalAttribute returns LogicalAttribute:
    NamedObjectFragment
    ('datatype' ':' datatype=STRING)?
    ('length' ':' length=NUMBER)?
    ('precision' ':' precision=NUMBER)?
    ('scale' ':' scale=NUMBER)?
    (identifier?='identifier' ':' ('TRUE' | 'true'))?
    CustomPropertiesFragment?
;
