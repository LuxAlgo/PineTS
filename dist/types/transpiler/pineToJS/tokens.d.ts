export declare const TokenType: {
    NUMBER: string;
    STRING: string;
    BOOLEAN: string;
    IDENTIFIER: string;
    KEYWORD: string;
    OPERATOR: string;
    LPAREN: string;
    RPAREN: string;
    LBRACKET: string;
    RBRACKET: string;
    LBRACE: string;
    RBRACE: string;
    COMMA: string;
    DOT: string;
    COLON: string;
    SEMICOLON: string;
    INDENT: string;
    DEDENT: string;
    NEWLINE: string;
    COMMENT: string;
    EOF: string;
};
export declare const Keywords: Set<string>;
export declare const MultiCharOperators: string[];
export declare class Token {
    type: string;
    value: any;
    line: number;
    column: number;
    indent: number;
    constructor(type: string, value: any, line: number, column: number, indent?: number);
}
