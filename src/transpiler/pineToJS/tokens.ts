// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

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
    'as',
    'import',
    'export',
    'method',
    'enum',
]);

// Keywords that TradingView treats as reserved only where they introduce a
// declaration (`type Foo`, `method bar(...)`, `enum E`) — everywhere else they
// are ordinary identifiers: `type = close`, `method(x) => x`, `int type = 0`.
// The lexer downgrades them to IDENTIFIER outside the declaration position.
export const ContextualKeywords = new Set(['type', 'method', 'enum']);

// Words TradingView rejects as variable / function / parameter / field / type
// names with `"X" cannot be used as a variable or function name.` even though
// they carry no syntax of their own (v5 migration guide "reserved words" list).
// They lex as IDENTIFIER — `text` is still a valid named argument
// (`label.new(..., text="...")`) — and are rejected at declaration sites only.
export const ReservedWords = new Set([
    'catch',
    'class',
    'do',
    'ellipse',
    'is',
    'polygon',
    'range',
    'return',
    'struct',
    'text',
    'throw',
    'try',
]);

// Multi-character operators
export const MultiCharOperators = ['==', '!=', '<=', '>=', ':=', '+=', '-=', '*=', '/=', '%=', '=>', '//', 'and', 'or', 'not'];

export class Token {
    /**
     * Present on the first token of a line that the lexer joined onto the
     * previous line because its indentation is not a multiple of four
     * (Pine line wrapping). `width` is the measured indentation in columns,
     * `fromLine` the line it was joined to, `column` where the token starts.
     */
    public wrapped: { width: number; fromLine: number | null; column: number } | null = null;

    /**
     * Set on a `[` lexed inside ( ) / [ ] / { }, where newlines are not
     * emitted: whatever line it sits on, it cannot open a new statement.
     */
    public grouped = false;

    /** Column of the opening quote of a single-line string literal (`column` is past the closing one). */
    public startColumn?: number;

    constructor(public type: string, public value: any, public line: number, public column: number, public indent = 0, public raw: string = null) {}

    // toString() {
    //     return `Token(${this.type}, ${JSON.stringify(this.value)}, ${this.line}:${this.column}, indent=${this.indent})`;
    // }
}
