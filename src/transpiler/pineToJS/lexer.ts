// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

// PineScript Lexer with Indentation Tracking
// Generates INDENT/DEDENT tokens like Python

import { TokenType, Keywords, ContextualKeywords, MultiCharOperators, Token } from './tokens';

export class Lexer {
    // TradingView counts a tab as four columns when measuring indentation.
    static readonly TAB_WIDTH = 4;

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
    // Set when the line being lexed was joined onto the previous one; attached
    // to the next token emitted (see joinWithPreviousLine).
    private pendingWrap: { width: number; fromLine: number | null; column: number } | null = null;
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
        this.resolveContextualKeywords();
        return this.tokens;
    }

    /**
     * `type`, `method` and `enum` are keywords only where they introduce a
     * declaration: first token of a logical line (optionally after `export`)
     * and followed by a name — `type Foo`, `method float f(`, `enum E`.
     * Anywhere else TradingView treats them as plain identifiers:
     * `type = close`, `method(x) => x`, `var enum = 0`, `int type = 0`,
     * `t.type`, `switch method`. Downgrade those occurrences to IDENTIFIER so
     * the parser only ever sees the keyword form in declaration position.
     *
     * NEWLINE/INDENT/DEDENT and comment-only lines are layout. A token the
     * lexer joined onto the previous line (`wrapped`) is never a line start.
     */
    private resolveContextualKeywords() {
        const isLayout = (t: Token) =>
            t.type === TokenType.NEWLINE || t.type === TokenType.INDENT || t.type === TokenType.DEDENT || t.type === TokenType.COMMENT;
        // Any word can follow as the declared name — including another
        // keyword (`type type`, `method in(...)`): the parser then reports
        // the reserved name, exactly as TradingView does.
        const isName = (t: Token | undefined) => !!t && (t.type === TokenType.IDENTIFIER || t.type === TokenType.KEYWORD);

        for (let i = 0; i < this.tokens.length; i++) {
            const t = this.tokens[i];
            if (t.type !== TokenType.KEYWORD || !ContextualKeywords.has(t.value)) continue;

            let j = i - 1;
            while (j >= 0 && this.tokens[j].type === TokenType.COMMENT) j--;
            const prev = j >= 0 ? this.tokens[j] : null;
            const atLineStart =
                !t.wrapped && (prev === null || isLayout(prev) || (prev.type === TokenType.KEYWORD && prev.value === 'export'));

            if (!(atLineStart && isName(this.tokens[i + 1]))) {
                t.type = TokenType.IDENTIFIER;
            }
        }
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

    /**
     * Handle indentation at start of line.
     *
     * TradingView measures a line's indentation in columns, a tab counting as
     * four (verified: `  \t` and `\t  ` both behave as six columns, not as a
     * tab stop). What the width means:
     *
     *   - A multiple of four is a block level. One level deeper than the
     *     enclosing block opens a local block; the same level is a sibling
     *     statement; shallower closes blocks. Jumping more than one level
     *     deeper is a compile error on TradingView ("Mismatched input ...
     *     expecting 'end of line without line continuation'").
     *   - Anything else is LINE WRAPPING: the line continues the previous
     *     logical line, whatever it starts with (`- r2`, `.size()`, `2`,
     *     `? a`). Whether the joined line parses is then the parser's call —
     *     `if x` + `  y := 1` is rejected by TradingView as a syntax error,
     *     not as an indentation error.
     *
     * Wrapped lines are joined here by dropping the NEWLINE (and trailing
     * comment) tokens that separated them from the previous line, so the
     * parser only ever sees NEWLINE between real statements and never has to
     * guess whether a leading `-` is a binary continuation or a new unary
     * statement (TradingView: new statement).
     */
    handleIndentation() {
        let width = 0;

        while (this.pos < this.source.length) {
            const ch = this.peek();
            if (ch === ' ') {
                width += 1;
                this.advance();
            } else if (ch === '\t') {
                width += Lexer.TAB_WIDTH;
                this.advance();
            } else {
                break;
            }
        }

        // Blank line: no block structure. The whitespace was consumed; the
        // newline is handled by the main loop.
        if (this.peek() === '\n' || this.peek() === '\r' || this.peek() === '\0') {
            return;
        }

        // A comment-only line carries no block structure either. TradingView
        // ignores it for indentation entirely, and a commented-out statement
        // left a column or two off the block it sits in is ordinary in real
        // scripts. Treat it like a blank line: no INDENT, no DEDENT, no
        // misaligned-dedent error.
        if (this.peek() === '/' && this.peek(1) === '/') {
            return;
        }

        // Line wrapping: indentation that is not a multiple of four continues
        // the previous line. Also accepted (leniently — TradingView rejects
        // this one) is a continuation onto a multiple-of-four column when the
        // previous line cannot be complete because it ends in a binary /
        // assignment / ternary operator, a comma, or `and` / `or`: the intent
        // is unambiguous and real scripts do it.
        if (width % Lexer.TAB_WIDTH !== 0 || this.isContinuationFromPrevToken()) {
            this.joinWithPreviousLine(width);
            return;
        }

        const level = width / Lexer.TAB_WIDTH;
        const currentLevel = this.indentStack[this.indentStack.length - 1];

        if (level > currentLevel) {
            if (level > currentLevel + 1) {
                const expected = (currentLevel + 1) * Lexer.TAB_WIDTH;
                throw new Error(
                    `Indentation error at ${this.line}:${this.column} - line is indented by ${width} columns, ` +
                        `but a local block must be indented by exactly one level (${expected} columns: four spaces or one tab) ` +
                        `deeper than the enclosing block`
                );
            }
            this.indentStack.push(level);
            this.addToken(TokenType.INDENT, '', level);
        } else if (level < currentLevel) {
            while (this.indentStack.length > 1 && this.indentStack[this.indentStack.length - 1] > level) {
                this.indentStack.pop();
                this.addToken(TokenType.DEDENT, '', this.indentStack[this.indentStack.length - 1]);
            }
            if (this.indentStack[this.indentStack.length - 1] !== level) {
                throw new Error(`Indentation error at ${this.line}:${this.column} - misaligned dedent`);
            }
        }
        // Same level: sibling statement, nothing to emit.
    }

    /**
     * Splice the line about to be lexed onto the previous logical line by
     * removing the NEWLINE / COMMENT tokens that separate them. Blank and
     * comment-only lines in between are layout and go too. INDENT / DEDENT
     * tokens are never removed: they belong to the previous real statement.
     *
     * The first token of the wrapped line is tagged with `wrapped` so the
     * parser can explain a syntax error caused by the join (TradingView says
     * "Syntax error at input 'v'" for `    v := 1` + `      v := 2`, which is
     * baffling without knowing the second line was treated as wrapping).
     */
    private joinWithPreviousLine(width: number) {
        let fromLine: number | null = null;
        while (this.tokens.length > 0) {
            const last = this.tokens[this.tokens.length - 1];
            if (last.type !== TokenType.NEWLINE && last.type !== TokenType.COMMENT) break;
            this.tokens.pop();
        }
        if (this.tokens.length === 0) return; // first line of the file: nothing to join to
        fromLine = this.tokens[this.tokens.length - 1].line;
        // this.column is the column of the first non-blank character.
        this.pendingWrap = { width, fromLine, column: this.column };
    }

    /**
     * True when the most recently emitted token (skipping NEWLINE / COMMENT
     * — those are layout, not content) is a token that requires a right-
     * hand-side and therefore implies the next non-blank line is a
     * continuation, not a new block.
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

        // Inside ( ) / [ ] / { } newlines are already suppressed, so a comment
        // there is pure layout: `f(a, 8 // note` ⏎ `  , b)` must read as
        // `f(a, 8, b)`. Emitting a token would put COMMENT between `8` and `,`.
        if (this.parenDepth > 0 || this.bracketDepth > 0 || this.braceDepth > 0) {
            return;
        }

        this.addToken(TokenType.COMMENT, comment.trim());
    }

    // Read string literal
    readString() {
        if (this.peek(1) === this.peek() && this.peek(2) === this.peek()) {
            this.readMultilineString();
            return;
        }

        const quote = this.advance();
        const startCol = this.column - 1;
        let value = '';

        while (this.pos < this.source.length && this.peek() !== quote) {
            if (this.peek() === '\\') {
                value += this.readEscape(quote);
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

    // Consume a backslash escape sequence and return the character it denotes.
    private readEscape(quote: string): string {
        this.advance(); // backslash
        const escaped = this.advance();
        switch (escaped) {
            case 'n':
                return '\n';
            case 't':
                return '\t';
            case 'r':
                return '\r';
            case '\\':
                return '\\';
            case quote:
                return quote;
            default:
                return escaped;
        }
    }

    /**
     * Triple-quoted multiline string (`"""..."""` or `'''...'''`). The text
     * keeps its layout — newlines and the leading spaces of each line are part
     * of the value — while backslash escapes are processed as in a normal
     * string (verified against TradingView with str.length: `"""a\nb"""` is 3
     * characters). The lines inside the string never reach handleIndentation,
     * so their indentation carries no block structure.
     */
    private readMultilineString() {
        const quote = this.peek();
        const startLine = this.line;
        const startCol = this.column;
        this.advance();
        this.advance();
        this.advance();

        let value = '';
        while (this.pos < this.source.length) {
            const ch = this.peek();
            if (ch === quote && this.peek(1) === quote && this.peek(2) === quote) {
                this.advance();
                this.advance();
                this.advance();
                this.addToken(TokenType.STRING, value);
                return;
            }
            if (ch === '\r') {
                this.advance();
                continue;
            }
            if (ch === '\n') {
                this.advance();
                this.line++;
                this.column = 1;
                value += '\n';
                continue;
            }
            if (ch === '\\') {
                value += this.readEscape(quote);
                continue;
            }
            value += this.advance();
        }

        throw new Error(`Unterminated multiline string at ${startLine}:${startCol}`);
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
            case '[': {
                const grouped = this.parenDepth > 0 || this.bracketDepth > 0 || this.braceDepth > 0;
                this.bracketDepth++;
                this.advance();
                this.addToken(TokenType.LBRACKET, ch);
                this.tokens[this.tokens.length - 1].grouped = grouped;
                return true;
            }
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
        if (this.pendingWrap) {
            token.wrapped = this.pendingWrap;
            this.pendingWrap = null;
        }
        this.tokens.push(token);
    }
}
