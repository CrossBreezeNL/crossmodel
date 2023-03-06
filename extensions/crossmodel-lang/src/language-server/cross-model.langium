grammar CrossModel

entry CrossModelRoot:
    (entity=Entity | relationship=Relationship | diagram=SystemDiagram);

Entity:
    'entity' name=ID '{'
        'description' ':=' description=STRING ';'
        ('attributes' '{' (attributes+=Attribute + ';')* '}' )?
    '}'
    ;

Attribute:
    name=ID ':=' value=(STRING | NUMBER);

Relationship:
    'relationship' name=ID '{'
        'source' ':=' source=[Entity:QualifiedName] ('with' sourceAttribute=[Attribute:QualifiedName])? ';'
        'target' ':=' target=[Entity:QualifiedName] ('with' targetAttribute=[Attribute:QualifiedName])? ';'
        'type' ':=' type=RelationshipType ';'
        ('properties' '{' (properties+=Property + ';')* '}' )?
    '}'
    ;

Property:
    key=ID ':=' value=(STRING | NUMBER);

RelationshipType returns string:
    '1:1' | '1:n' | 'n:1' | 'n:m';


SystemDiagram:
    'diagram' '{'
        (nodes+=DiagramNode ';')*
        (edges+=DiagramEdge ';')*
    '}'
    ;

DiagramNode:
    'node' name=ID 'for' semanticElement=[Entity:QualifiedName] '{'
        'x' ':=' x=NUMBER ';'
        'y' ':=' y=NUMBER ';'
        'width' ':=' width=NUMBER ';'
        'height' ':=' height=NUMBER ';'
    '}'
    ;

DiagramEdge:
    'edge' name=ID 'for' semanticElement=[Relationship:QualifiedName] '{'
        'source' ':=' source=[DiagramNode:QualifiedName] ';'
        'target' ':=' target=[DiagramNode:QualifiedName] ';'
        // for non-straight connections we also need to save routing points
    '}'
    ;


QualifiedName returns string:
    ID ('.' ID)*;

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z@][\w_\-@\/#]*/;
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER returns number: /(-)?[0-9]+(\.[0-9]*)?/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
