import 'terminals'
import 'common'
import 'entity'

// Relationship definition
interface Relationship extends DataElementContainerLink, WithCustomProperties {
    parent: @Entity
    parentRole?: string
    parentCardinality?: string
    child: @Entity
    childRole?: string
    childCardinality?: string
    attributes: RelationshipAttribute[]
}

Cardinality returns string: '0' | '1' | 'n';

Relationship returns Relationship:
    'relationship' ':' 
        INDENT
            NamedObjectFragment
            'parent' ':' parent=[Entity:IDReference]
            ('parentRole' ':' parentRole=STRING)?
            ('parentCardinality' ':' parentCardinality=Cardinality)?
            'child' ':' child=[Entity:IDReference]
            ('childRole' ':' childRole=STRING)?
            ('childCardinality' ':' childCardinality=Cardinality)?
            ('attributes' ':'
                INDENT 
                    (LIST_ITEM attributes+=RelationshipAttribute)+
                DEDENT
            )?
            CustomPropertiesFragment?
        DEDENT
;

interface RelationshipAttribute extends WithCustomProperties {
    parent: @EntityAttribute
    child: @EntityAttribute
}

RelationshipAttribute returns RelationshipAttribute:
    'parent' ':' parent=[EntityAttribute:IDReference]
    'child' ':' child=[EntityAttribute:IDReference]
    CustomPropertiesFragment?
;
