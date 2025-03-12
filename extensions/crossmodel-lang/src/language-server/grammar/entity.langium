import 'terminals'
import 'common'

interface LogicalEntity extends DataElementContainer, WithCustomProperties {
    superEntities: @LogicalEntity[]
    attributes: LogicalAttribute[]
}

// LogicalEntity definition 
LogicalEntity returns LogicalEntity:
    'entity' ':'
        INDENT
            NamedObjectFragment
            ('inherits' ':'
                INDENT
                    (LIST_ITEM superEntities+=[LogicalEntity:IDReference])+
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
