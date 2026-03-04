// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

// Token types for PineScript lexer

export const TokenType = {
    // Literals
    NUMBER: 'NUMBER',
    STRING: 'STRING',
    BOOLEAN: 'BOOLEAN',

    // Identifiers and keywords
    IDENTIFIER: 'IDENTIFIER',
    KEYWORD: 'KEYWORD',

    // Operators
    OPERATOR: 'OPERATOR',

    // Punctuation
    LPAREN: 'LPAREN', // (
    RPAREN: 'RPAREN', // )
    LBRACKET: 'LBRACKET', // [
    RBRACKET: 'RBRACKET', // ]
    LBRACE: 'LBRACE', // {
    RBRACE: 'RBRACE', // }
    COMMA: 'COMMA', // ,
    DOT: 'DOT', // .
    COLON: 'COLON', // :
    SEMICOLON: 'SEMICOLON', // ;

    // Indentation (critical for PineScript!)
    INDENT: 'INDENT',
    DEDENT: 'DEDENT',
    NEWLINE: 'NEWLINE',

    // Special
    COMMENT: 'COMMENT',
    EOF: 'EOF',
};

export const Keywords = new Set([
    // Control flow
    'if',
    'else',
    'for',
    'while',
    'switch',
    'break',
    'continue',

    // Declarations
    'var',
    'varip',
    'type',

    // Logical operators
    'and',
    'or',
    'not',

    // Other
    'to',
    'by',
    'in',
    'import',
    'export',
    'method',
    'extends',
    'enum',
]);

// Multi-character operators
export const MultiCharOperators = ['==', '!=', '<=', '>=', ':=', '+=', '-=', '*=', '/=', '%=', '=>', '//', 'and', 'or', 'not'];

export class Token {
    constructor(public type: string, public value: any, public line: number, public column: number, public indent = 0) {}

    // toString() {
    //     return `Token(${this.type}, ${JSON.stringify(this.value)}, ${this.line}:${this.column}, indent=${this.indent})`;
    // }
}
