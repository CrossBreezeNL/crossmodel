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
    ('relations' ':'
        INDENT
            ('-' relations+=SourceObjectRelations)*
        DEDENT
    )?
;

JoinType returns string: 'from' | 'inner-join' | 'cross-join' | 'left-join' | 'apply';

SourceObjectRelations:
    'source' ':' source=[SourceObject:IDReference]
    'conditions' ':'
        INDENT 
            ('-' conditions+=SourceObjectCondition)*
        DEDENT
;

SourceObjectCondition: RelationshipCondition | JoinCondition;

RelationshipCondition:
    'relationship' ':' relationship=[Relationship:IDReference]
;

JoinCondition:
    'join' ':' join=JoinExpression
;

JoinExpression:
    source=[SourceObjectAttribute:IDReference] operator='=' target=[SourceObjectAttribute:IDReference]
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
    value=[TargetObjectAttribute:IDReference];

AttributeMappingSource:
    {infer ReferenceSource} value=[SourceObjectAttribute:IDReference] |
    {infer NumberLiteral} value=NUMBER |
    {infer StringLiteral} value=STRING
;
