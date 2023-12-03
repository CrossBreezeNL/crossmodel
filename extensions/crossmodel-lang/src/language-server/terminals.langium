
// Identification for cross references
IDReference returns string:
    ID ('.' ID)*;

// Scalar values
terminal STRING: /"[^"]*"|'[^']*'/;
terminal NUMBER returns number: /(-)?[0-9]+(\.[0-9]*)?/;

// Misc
hidden terminal SL_COMMENT: /#[^\n\r]*/;

// Terminals to get the indentation working
hidden terminal NEWLINE: 'this_string_does_not_matter_newline#$%^&*((';
terminal DEDENT: 'this_string_does_not_matter_dedent#$%^&*((';
terminal INDENT: 'this_string_does_not_matter_indent#$%^&*((';
hidden terminal SPACES: 'this_string_does_not_matter_spaces#$%^&*((';

terminal ID: /[_a-zA-Z][\w_\-~$#@/\d]*/;
