import 'terminals'
import 'common'
import 'entity'
import 'relationship'

interface SourceObjectAttribute extends EntityAttribute {
}

interface TargetObjectAttribute extends EntityAttribute {
}

interface Mapping extends DataElementContainerMapping, WithCustomProperties {
    sources: SourceObject[];
    target: TargetObject;
}

Mapping returns Mapping:
    'mapping' ':'
        INDENT
            NamedObjectFragment
            ('sources' ':'
                INDENT 
                    (LIST_ITEM sources+=SourceObject)+
                DEDENT
            )?
            'target' ':' target=TargetObject
            CustomPropertiesFragment?
        DEDENT
;

interface SourceObject extends SourceDataElementContainer, WithCustomProperties {
    entity: @Entity;
    join: string;
    dependencies: SourceObjectDependency[]
    conditions: SourceObjectCondition[]
}

SourceObject returns SourceObject:
    NamedObjectFragment
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
    CustomPropertiesFragment?
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

interface TargetObject extends WithCustomProperties {
    entity: @Entity;
    mappings: AttributeMapping[];
}

TargetObject returns TargetObject:
    INDENT
        'entity' ':' entity=[Entity:IDReference] // implies attributes through entity
        ('mappings' ':'
            INDENT 
                (LIST_ITEM mappings+=AttributeMapping)+     
            DEDENT
        )?
        CustomPropertiesFragment?
    DEDENT
;

interface AttributeMapping extends WithCustomProperties {
    attribute: AttributeMappingTarget;
    sources: AttributeMappingSource[];
    expression: string;
}

AttributeMapping returns AttributeMapping:
    'attribute' ':' attribute=AttributeMappingTarget
    ('sources' ':' 
        INDENT 
            (LIST_ITEM sources+=AttributeMappingSource)+     
        DEDENT
    )?
    ('expression' ':' expression=STRING)?
    CustomPropertiesFragment?
;

AttributeMappingTarget:
    value=[TargetObjectAttribute:IDReference]
;

AttributeMappingSource:
    value=[SourceObjectAttribute:IDReference]
;
