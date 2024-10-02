import 'terminals'
import 'entity'
import 'relationship'

interface SourceObjectAttribute extends Attribute, WithCustomProperties {
}

interface TargetObjectAttribute extends Attribute, WithCustomProperties {
}

Mapping:
    'mapping' ':'
        INDENT
            'id' ':' id=ID
            ('sources' ':'
                INDENT 
                    (LIST_ITEM sources+=SourceObject)+
                DEDENT
            )?
            'target' ':' target=TargetObject
            CustomProperties?
        DEDENT
;

SourceObject:
    'id' ':' id=ID
    'entity' ':' entity=[Entity:IDReference] // implies attributes through entity
    'join' ':' join=JoinType
    ('dependencies' ':'
        INDENT
            (LIST_ITEM dependencies+=SourceObjectDependency)*
        DEDENT
    )?
    ('conditions' ':'
        INDENT 
            (LIST_ITEM conditions+=SourceObjectCondition)*
        DEDENT
    )?
    // for some reason using the CustomProperties fragment here causes parsing issues in the language server
    ('customProperties' ':'
        INDENT
            (LIST_ITEM customProperties+=CustomProperty)*
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
                (LIST_ITEM mappings+=AttributeMapping)+     
            DEDENT
        )?
        // for some reason using the CustomProperties fragment here causes parsing issues in the language server
        ('customProperties' ':'
            INDENT
                (LIST_ITEM customProperties+=CustomProperty)*
            DEDENT
        )?
    DEDENT
;

AttributeMapping:
    'attribute' ':' attribute=AttributeMappingTarget
    ('sources' ':' 
        INDENT 
            (LIST_ITEM sources+=AttributeMappingSource)+     
        DEDENT
    )?
    ('expression' ':' expression=STRING)?
    CustomProperties?
;

AttributeMappingTarget:
    value=[TargetObjectAttribute:IDReference]
;

AttributeMappingSource:
    value=[SourceObjectAttribute:IDReference]
;
