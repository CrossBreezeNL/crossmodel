import 'terminals'
import 'entity'
import 'relationship'

Mapping:
    'mapping' ':'
        INDENT
            'id' ':' id=ID
            'sources' ':'
                INDENT 
                    sourceObjects+=SourceObject+
                DEDENT
            'target' ':' target=TargetMapping
        DEDENT
;

SourceObject:
    '-' 'id' ':' id=ID 
        'object' ':' object=[Entity:IDReference]  // implied attributes through entity
        'join' ':' join=JoinType 
        ('relations' ':'
            INDENT
                relations+=SourceObjectRelations*     
            DEDENT)?
;

interface SourceObjectAttribute extends Attribute {
}

JoinType returns string: 'from' | 'inner-join' | 'cross-join' | 'left-join' | 'apply';

SourceObjectRelations:
    '-' 'source' ':' source=[SourceObject:IDReference]
        'conditions' ':'
            INDENT 
                conditions+=SourceObjectCondition*     
            DEDENT
;

SourceObjectCondition: RelationshipCondition | JoinCondition;

RelationshipCondition:
    '-' 'relationship' ':' relationship=[Relationship:IDReference]
;

JoinCondition:
    '-' 'join' ':' expression=JoinExpression
;

JoinExpression:
    source=[SourceObjectAttribute:IDReference] operator='=' target=[SourceObjectAttribute:IDReference]
;

TargetMapping:
    INDENT
        'entity' ':' entity=[Entity:IDReference]
        'attributes' ':'
            INDENT 
                attributes+=TargetAttribute*     
            DEDENT
    DEDENT
;

TargetAttribute:
    '-' 'attribute' ':' attribute=[EntityAttribute:IDReference] 
        'source' ':' source=TargetAttributeSource
;

TargetAttributeSource:
    {infer ReferenceSource} value=[SourceObjectAttribute:IDReference] |
    {infer NumberLiteral} value=NUMBER |
    {infer StringLiteral} value=STRING
;