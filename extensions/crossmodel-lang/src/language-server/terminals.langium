// COMMON

// Identification for cross references
IDReference returns string:
    ID ('.' ID)*;

// Custom properties
interface WithCustomProperties {
    customProperties: CustomProperty[];
}

fragment CustomProperties:
    'customProperties' ':'
        INDENT
            (LIST_ITEM customProperties+=CustomProperty)*
        DEDENT
    ;

CustomProperty:
    'name' ':' name=ID
    ('value' ':' value=STRING)?;

// Scalar values
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER returns number: /(-)?[0-9]+(\.[0-9]*)?/;

// Misc
hidden terminal SL_COMMENT: /#[^\n\r]*/;

// Terminals to get the indentation working
terminal INDENT: ':synthetic-indent:';
terminal DEDENT: ':synthetic-dedent:';
terminal LIST_ITEM: '- '; // block sequence entry
hidden terminal NEWLINE: /[/\r\n|\r|\n/]+/;
hidden terminal WS: /[ \t]+/; 

terminal ID: /[_a-zA-Z][\w_\-~$#@/\d]*/; 
