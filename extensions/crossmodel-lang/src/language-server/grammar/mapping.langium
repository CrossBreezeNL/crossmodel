import 'terminals'
import 'common'
import 'entity'
import 'relationship'

interface SourceObjectAttribute extends EntityAttribute {
}

interface TargetObjectAttribute extends EntityAttribute {
}

interface Mapping extends DataElementContainerMapping {
    sources: SourceObject[];
    target: TargetObject;
}

Mapping returns Mapping:
    'mapping' ':'
        INDENT
            'id' ':' id=ID
            'name' ':' name=STRING
            ('description' ':' description=STRING)?
            ('sources' ':'
                INDENT 
                    (LIST_ITEM sources+=SourceObject)+
                DEDENT
            )?
            'target' ':' target=TargetObject
            CustomProperties?
        DEDENT
;

interface SourceObject extends SourceDataElementContainer {
    entity: @Entity;
    join: string;
    dependencies: SourceObjectDependency[]
    conditions: SourceObjectCondition[]
}

SourceObject returns SourceObject:
    'id' ':' id=ID
    'name' ':' name=STRING
    'entity' ':' entity=[Entity:IDReference] // implies attributes through entity
    'join' ':' join=JoinType
    ('description' ':' description=STRING)?
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
        // for some reason using the CustomProperties fragment here causes parsing issues in the language server
        ('customProperties' ':'
            INDENT
                (LIST_ITEM customProperties+=CustomProperty)*
            DEDENT
        )?
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
    CustomProperties?
;

AttributeMappingTarget:
    value=[TargetObjectAttribute:IDReference]
;

AttributeMappingSource:
    value=[SourceObjectAttribute:IDReference]
;
