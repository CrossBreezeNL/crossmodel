import 'terminals'
import 'entity'
import 'relationship'

interface SourceObjectAttribute extends Attribute {
}

interface TargetObjectAttribute extends Attribute {
}

Mapping:
    'mapping' ':'
        INDENT
            'id' ':' id=ID
            ('sources' ':'
                INDENT 
                    ('-' sources+=SourceObject)+
                DEDENT
            )?
            'target' ':' target=TargetObject
        DEDENT
;

SourceObject:
    'id' ':' id=ID
    'entity' ':' entity=[Entity:IDReference] // implies attributes through entity
    'join' ':' join=JoinType
    ('dependencies' ':'
        INDENT
            ('-' dependencies+=SourceObjectDependency)*
        DEDENT
    )?
    ('conditions' ':'
        INDENT 
            ('-' conditions+=SourceObjectCondition)*
        DEDENT
    )?
;

JoinType returns string: 'from' | 'inner-join' | 'cross-join' | 'left-join' | 'apply';

SourceObjectDependency:
    source=[SourceObject:IDReference]
;

SourceObjectCondition: JoinCondition
;

JoinCondition: expression=BinaryExpression
;

BinaryExpression:
    left=PrimaryExpression op=('=' | '!=' | '<' | '<=' | '>' | '>=') right=PrimaryExpression
;

PrimaryExpression infers BooleanExpression:
    {infer NumberLiteral} value=NUMBER |
    {infer StringLiteral} value=STRING |
    {infer SourceObjectAttributeReference} value=[SourceObjectAttribute:IDReference]
;

TargetObject:
    INDENT
        'entity' ':' entity=[Entity:IDReference] // implies attributes through entity
        ('mappings' ':'
            INDENT 
                ('-' mappings+=AttributeMapping)+     
            DEDENT
        )?
    DEDENT
;

AttributeMapping:
    'attribute' ':' attribute=AttributeMappingTarget
    ('sources' ':' 
        INDENT 
            ('-' sources+=AttributeMappingSource)+     
        DEDENT
    )?
    ('expression' ':' expression=STRING)?
;

AttributeMappingTarget:
    value=[TargetObjectAttribute:IDReference]
;

AttributeMappingSource:
    value=[SourceObjectAttribute:IDReference]
;
