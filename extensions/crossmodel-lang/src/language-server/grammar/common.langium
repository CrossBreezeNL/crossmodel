import 'terminals'

interface IdentifiedObject {
    id: string;
}

interface NamedObject extends IdentifiedObject {
    name: string;
    description: string;
}

interface DataContainer extends NamedObject {
}

interface DataElement extends NamedObject {
    datatype: string;
}
