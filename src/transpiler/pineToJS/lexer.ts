// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

// PineScript Lexer with Indentation Tracking
// Generates INDENT/DEDENT tokens like Python

import { TokenType, Keywords, MultiCharOperators, Token } from './tokens';

export class Lexer {
    private source: string;
    private pos: number;
    private line: number;
    private column: number;
    private tokens: Token[];
    private indentStack: number[];
    private atLineStart: boolean;
    private parenDepth: number;
    private bracketDepth: number;
    private braceDepth: number;
    constructor(source: string) {
        this.source = source;
        this.pos = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];

        // Indentation stack - tracks nesting levels
        this.indentStack = [0]; // Start with 0 indentation

        // Track if we're at the start of a line
        this.atLineStart = true;

        // Track if we're in a line continuation
        this.parenDepth = 0;
        this.bracketDepth = 0;
        this.braceDepth = 0;
    }

    // Main tokenize method
    tokenize() {
        while (this.pos < this.source.length) {
            const ch = this.peek();

            // Handle carriage return (Windows CRLF line endings)
            // Skip \r - the following \n will be handled as newline
            if (ch === '\r') {
                this.advance();
                continue;
            }

            // Handle newlines and indentation
            if (ch === '\n') {
                this.handleNewline();
                continue;
            }

            // Handle indentation at start of line (before anything else)
            if (this.atLineStart && ch !== '\n') {
                this.handleIndentation();
                this.atLineStart = false;
                continue; // Let next iteration handle the actual token
            }

            // Skip inline whitespace
            if (ch === ' ' || ch === '\t') {
                this.advance();
                continue;
            }

            if (this.pos >= this.source.length) break;

            // Comments
            if (ch === '/' && this.peek(1) === '/') {
                this.readComment();
                continue;
            }

            // Strings
            if (ch === '"' || ch === "'") {
                this.readString();
                continue;
            }

            // Color literals (#RRGGBB or #RRGGBBAA)
            if (ch === '#') {
                this.readColorLiteral();
                continue;
            }

            // Numbers
            if (this.isDigit(ch)) {
                this.readNumber();
                continue;
            }

            // Identifiers and keywords
            if (this.isIdentifierStart(ch)) {
                this.readIdentifier();
                continue;
            }

            // Operators and punctuation
            if (this.readOperatorOrPunctuation()) {
                continue;
            }

            throw new Error(`Unexpected character '${ch}' at ${this.line}:${this.column}`);
        }

        // Close any remaining indentation levels
        while (this.indentStack.length > 1) {
            this.indentStack.pop();
            this.addToken(TokenType.DEDENT, '', this.getCurrentIndent());
        }

        this.addToken(TokenType.EOF, '');
        return this.tokens;
    }

    // Handle newline and emit NEWLINE token
    handleNewline() {
        // Don't emit newlines if we're inside parentheses/brackets (line continuation)
        if (this.parenDepth === 0 && this.bracketDepth === 0 && this.braceDepth === 0) {
            this.addToken(TokenType.NEWLINE, '\n');
            this.atLineStart = true;
        }

        this.advance();
        this.line++;
        this.column = 1;
    }

    // Handle indentation at start of line
    handleIndentation() {
        let indent = 0;
        let spaceCount = 0;
        const startPos = this.pos;

        // Count spaces (4 spaces = 1 indent level, 1 tab = 1 indent level)
        while (this.pos < this.source.length) {
            const ch = this.peek();
            if (ch === ' ') {
                spaceCount++;
                this.advance();
            } else if (ch === '\t') {
                indent++;
                this.advance();
            } else {
                break;
            }
        }

        // Check if this is a blank line (only whitespace followed by newline or EOF)
        // If so, skip indentation processing and keep position at whitespace
        if (this.peek() === '\n' || this.peek() === '\r' || this.peek() === '\0') {
            // Don't process indentation for blank lines
            // The whitespace will be skipped in the main loop
            return;
        }

        // Convert spaces to indent levels (4 spaces = 1 level)
        indent += Math.floor(spaceCount / 4);

        // Pine allows binary-operator (and comma / ternary `:` / logical
        // and|or) line continuation. The continuation line is typically
        // visually aligned past the operand of the previous line, which
        // looks like a deeper indent — but it must NOT push a new block
        // onto the indent stack. Without this guard, the lexer emits an
        // INDENT for the continuation line and a matching DEDENT when
        // the next real statement returns to the original block indent;
        // the block parser sees that DEDENT and prematurely closes the
        // surrounding function/if/for body, dropping subsequent
        // statements (which then reference now-out-of-scope parameters).
        if (this.isContinuationFromPrevToken()) {
            return;
        }

        const currentIndent = this.indentStack[this.indentStack.length - 1];

        // Increased indentation - emit INDENT
        if (indent > currentIndent) {
            this.indentStack.push(indent);
            this.addToken(TokenType.INDENT, '', indent);
        }
        // Decreased indentation - emit DEDENT(s)
        else if (indent < currentIndent) {
            while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1] > indent) {
                this.indentStack.pop();
                this.addToken(TokenType.DEDENT, '', this.indentStack[this.indentStack.length - 1]);
            }

            // Check for misaligned dedent
            if (this.indentStack[this.indentStack.length - 1] !== indent) {
                throw new Error(`Indentation error at ${this.line}:${this.column} - misaligned dedent`);
            }
        }
        // Same indentation - no INDENT/DEDENT
    }

    /**
     * True when the most recently emitted token (skipping NEWLINE / COMMENT
     * — those are layout, not content) is a token that requires a right-
     * hand-side and therefore implies the next non-blank line is a
     * continuation, not a new block. Mirrors the set the parser's
     * `peekOperatorEx` already crosses NEWLINE for.
     */
    private isContinuationFromPrevToken(): boolean {
        for (let i = this.tokens.length - 1; i >= 0; i--) {
            const t = this.tokens[i];
            if (t.type === TokenType.NEWLINE || t.type === TokenType.COMMENT) continue;
            if (t.type === TokenType.OPERATOR) {
                // `=>` introduces a new block (arrow function / method body),
                // not a continuation — the next indent IS a real INDENT.
                if (t.value === '=>') return false;
                return true;
            }
            if (t.type === TokenType.COMMA) return true;
            if (t.type === TokenType.COLON) return true;
            if (t.type === TokenType.KEYWORD && (t.value === 'and' || t.value === 'or')) return true;
            return false;
        }
        return false;
    }

    // Read comment
    readComment() {
        const startCol = this.column;
        let comment = '';

        // Skip //
        this.advance();
        this.advance();

        // Read until end of line
        while (this.pos < this.source.length && this.peek() !== '\n') {
            comment += this.advance();
        }

        this.addToken(TokenType.COMMENT, comment.trim());
    }

    // Read string literal
    readString() {
        const quote = this.advance();
        const startCol = this.column - 1;
        let value = '';

        while (this.pos < this.source.length && this.peek() !== quote) {
            if (this.peek() === '\\') {
                this.advance(); // skip backslash
                const escaped = this.advance();
                // Handle escape sequences
                switch (escaped) {
                    case 'n':
                        value += '\n';
                        break;
                    case 't':
                        value += '\t';
                        break;
                    case 'r':
                        value += '\r';
                        break;
                    case '\\':
                        value += '\\';
                        break;
                    case quote:
                        value += quote;
                        break;
                    default:
                        value += escaped;
                }
            } else {
                value += this.advance();
            }
        }

        if (this.peek() !== quote) {
            throw new Error(`Unterminated string at ${this.line}:${startCol}`);
        }

        this.advance(); // closing quote
        this.addToken(TokenType.STRING, value);
    }

    // Read color literal (#RRGGBB or #RRGGBBAA)
    readColorLiteral() {
        const startCol = this.column;
        let value = '#';
        this.advance(); // skip #

        // Read hex digits (6 or 8)
        while (this.pos < this.source.length && value.length < 9) {
            const ch = this.peek();
            if ((ch >= '0' && ch <= '9') || (ch >= 'A' && ch <= 'F') || (ch >= 'a' && ch <= 'f')) {
                value += this.advance();
            } else {
                break;
            }
        }

        // Validate length (should be #RRGGBB or #RRGGBBAA)
        if (value.length !== 7 && value.length !== 9) {
            throw new Error(`Invalid color literal '${value}' at ${this.line}:${startCol}`);
        }

        this.addToken(TokenType.STRING, value); // Treat as string
    }

    // Read number literal
    readNumber() {
        const startCol = this.column;
        let value = '';
        let hasDecimal = false;

        // Handle numbers starting with dot (e.g., .5 instead of 0.5)
        if (this.peek() === '.' && this.isDigit(this.peek(1))) {
            hasDecimal = true;
            value += this.advance(); // consume the dot
        }

        while (this.pos < this.source.length) {
            const ch = this.peek();

            if (this.isDigit(ch)) {
                value += this.advance();
            } else if (ch === '.' && !hasDecimal) {
                // Allow trailing dot (0. is valid in PineScript, means 0.0)
                // Also allow normal decimals (0.5)
                const nextCh = this.peek(1);
                if (this.isDigit(nextCh) || !this.isIdentifierStart(nextCh)) {
                    hasDecimal = true;
                    value += this.advance();
                    // If no digit after dot, we're done (trailing dot case)
                    if (!this.isDigit(this.peek())) {
                        break;
                    }
                } else {
                    // Next char is start of identifier, so dot is not part of number
                    break;
                }
            } else {
                break;
            }
        }

        // Check for scientific notation (e.g. 1e10, 1.5e-5)
        if (this.pos < this.source.length) {
            const ch = this.peek();
            if (ch === 'e' || ch === 'E') {
                const nextCh = this.peek(1);
                if (this.isDigit(nextCh)) {
                    // Case: 10e5
                    value += this.advance(); // consume 'e'
                    // consume digits
                    while (this.pos < this.source.length && this.isDigit(this.peek())) {
                        value += this.advance();
                    }
                } else if (nextCh === '+' || nextCh === '-') {
                    // Case: 10e+5 or 10e-5
                    const nextNextCh = this.peek(2);
                    if (this.isDigit(nextNextCh)) {
                        value += this.advance(); // consume 'e'
                        value += this.advance(); // consume sign
                        // consume digits
                        while (this.pos < this.source.length && this.isDigit(this.peek())) {
                            value += this.advance();
                        }
                    }
                }
            }
        }

        // Preserve the raw literal text so float literals keep their decimal
        // (`2.0` vs `2`, `.5`) through codegen — required for int/float inference.
        this.addToken(TokenType.NUMBER, parseFloat(value), null, value);
    }

    // Read identifier or keyword
    readIdentifier() {
        const startCol = this.column;
        let value = '';

        while (this.pos < this.source.length && this.isIdentifierChar(this.peek())) {
            value += this.advance();
        }

        // Check if it's a keyword
        if (Keywords.has(value)) {
            this.addToken(TokenType.KEYWORD, value);
        } else if (value === 'true' || value === 'false') {
            this.addToken(TokenType.BOOLEAN, value === 'true');
        } else {
            this.addToken(TokenType.IDENTIFIER, value);
        }
    }

    // Read operator or punctuation
    readOperatorOrPunctuation() {
        const ch = this.peek();
        const next = this.peek(1);
        const twoChar = ch + next;

        // Check for multi-character operators
        if (MultiCharOperators.includes(twoChar)) {
            this.advance();
            this.advance();
            this.addToken(TokenType.OPERATOR, twoChar);
            return true;
        }

        // Single character operators (excluding : which is punctuation)
        if ('+-*/%<>=!?'.includes(ch)) {
            this.advance();
            this.addToken(TokenType.OPERATOR, ch);
            return true;
        }

        // Punctuation
        switch (ch) {
            case '(':
                this.parenDepth++;
                this.advance();
                this.addToken(TokenType.LPAREN, ch);
                return true;
            case ')':
                this.parenDepth--;
                this.advance();
                this.addToken(TokenType.RPAREN, ch);
                return true;
            case '[':
                this.bracketDepth++;
                this.advance();
                this.addToken(TokenType.LBRACKET, ch);
                return true;
            case ']':
                this.bracketDepth--;
                this.advance();
                this.addToken(TokenType.RBRACKET, ch);
                return true;
            case '{':
                this.braceDepth++;
                this.advance();
                this.addToken(TokenType.LBRACE, ch);
                return true;
            case '}':
                this.braceDepth--;
                this.advance();
                this.addToken(TokenType.RBRACE, ch);
                return true;
            case ',':
                this.advance();
                this.addToken(TokenType.COMMA, ch);
                return true;
            case '.':
                // Check if this is a number starting with dot (e.g., .5 instead of 0.5)
                if (this.isDigit(this.peek(1))) {
                    this.readNumber();
                    return true;
                }
                this.advance();
                this.addToken(TokenType.DOT, ch);
                return true;
            case ':':
                this.advance();
                this.addToken(TokenType.COLON, ch);
                return true;
            case ';':
                this.advance();
                this.addToken(TokenType.SEMICOLON, ch);
                return true;
        }

        return false;
    }

    // Helper methods
    peek(offset = 0) {
        const pos = this.pos + offset;
        return pos < this.source.length ? this.source[pos] : '\0';
    }

    advance() {
        const ch = this.source[this.pos++];
        this.column++;
        return ch;
    }

    skipWhitespaceInline() {
        // Only skip spaces/tabs that are NOT at line start
        if (this.atLineStart) return;

        while (this.pos < this.source.length && (this.peek() === ' ' || this.peek() === '\t')) {
            this.advance();
        }
    }

    isDigit(ch) {
        return ch >= '0' && ch <= '9';
    }

    isIdentifierStart(ch) {
        return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_';
    }

    isIdentifierChar(ch) {
        return this.isIdentifierStart(ch) || this.isDigit(ch);
    }

    getCurrentIndent() {
        return this.indentStack[this.indentStack.length - 1];
    }

    addToken(type, value, indent = null, raw = null) {
        const token = new Token(type, value, this.line, this.column, indent !== null ? indent : this.getCurrentIndent(), raw);
        this.tokens.push(token);
    }
}
