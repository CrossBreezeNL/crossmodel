import 'terminals'

// Common interfaces and fragments.

interface IdentifiedObject {
    id: string;
}

fragment IdentifiedObject returns IdentifiedObject:
    'id' ':' id=ID;

interface NamedObject extends IdentifiedObject, WithCustomProperties {
    name: string;
    description?: string;
}

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

fragment CustomProperties returns WithCustomProperties:
    'customProperties' ':'
        INDENT
            (LIST_ITEM customProperties+=CustomProperty)*
        DEDENT
    ;

CustomProperty:
    'name' ':' name=ID
    ('value' ':' value=STRING)?;
