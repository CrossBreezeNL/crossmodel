import 'terminals'

// Common interfaces and fragments.

interface IdentifiedObject {
    id: string;
}

fragment IdentifiedObjectFragment returns IdentifiedObject:
    'id' ':' id=ID;

// For some reason we can't extend IdentifiedObject here, it results in compile errors because of incompatible $container variable.
// Hence we repeated the id property here and in the fragment.
interface NamedObject extends WithCustomProperties {
    id: string;
    name: string;
    description?: string;
}

fragment NamedObjectFragment returns NamedObject:
    'id' ':' id=ID
    'name' ':' name=STRING
    ('description' ':' description=STRING)?
;

interface DataElementContainer extends NamedObject {
}

interface DataElementContainerLink extends NamedObject {
}

interface DataElementContainerMapping extends NamedObject {
}

// The DataElementContainer acting as a source object in a mapping.
// The name is the alias.
interface SourceDataElementContainer extends NamedObject {
}

interface DataElementMapping extends IdentifiedObject {
}

interface DataElement extends NamedObject {
    datatype?: string;
}

// Custom properties
interface WithCustomProperties {
    customProperties: CustomProperty[];
}

fragment CustomPropertiesFragment returns WithCustomProperties:
    'customProperties' ':'
        INDENT
            (LIST_ITEM customProperties+=CustomProperty)*
        DEDENT
    ;

CustomProperty:
    'name' ':' name=ID
    ('value' ':' value=STRING)?;
