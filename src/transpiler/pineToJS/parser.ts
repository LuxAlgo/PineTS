// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

// PineScript Parser with Proper Indentation Support
// Uses INDENT/DEDENT tokens from lexer

import { Token, TokenType, ReservedWords } from './tokens';
import {
    Program,
    ExpressionStatement,
    VariableDeclaration,
    VariableDeclarator,
    FunctionDeclaration,
    TypeDefinition,
    IfStatement,
    ForStatement,
    WhileStatement,
    BlockStatement,
    ReturnStatement,
    Identifier,
    Literal,
    BinaryExpression,
    UnaryExpression,
    AssignmentExpression,
    UpdateExpression,
    CallExpression,
    MemberExpression,
    ConditionalExpression,
    ArrayExpression,
    ObjectExpression,
    Property,
    ArrayPattern,
    AssignmentPattern,
    ArrowFunctionExpression,
    SwitchExpression,
    SwitchCase,
    VariableDeclarationKind,
} from './ast';
import { NAMESPACE_COLLISION_NAMES } from '../settings';

export class Parser {
    private tokens: Token[];
    private pos: number;
    private functionNames: Set<string> = new Set();
    // Stack of parameter-name sets for currently-being-parsed function bodies.
    // When the body of fn `f(x, y) =>` is being parsed, the top frame is {x, y}.
    // Used to suppress the `name → name_var` rewrite for identifiers that are
    // really parameters of the enclosing function and just happen to share a
    // name with some other user function.
    private paramScopes: Set<string>[] = [];
    // Counter for the temps that carry a trailing loop's value out of a function body.
    private loopValueCounter: number = 0;
    // Tuple size returned by user functions whose last statement is a tuple
    // (`f(a) => [a, a * 2]`); null when the name is overloaded with other shapes.
    private functionTupleArity: Map<string, number | null> = new Map();
    // Parameter names of user functions, for TradingView's tuple-argument error;
    // null when the name is overloaded.
    private functionParamNames: Map<string, string[] | null> = new Map();
    // Opening `[` of each tuple literal, for errors reported at the literal.
    private tupleLiteralStart: WeakMap<object, Token> = new WeakMap();
    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.pos = 0;
    }

    // Utility methods
    peek(offset = 0) {
        return this.tokens[this.pos + offset] || this.tokens[this.tokens.length - 1];
    }

    // True if `name` is a parameter of any function whose body we're currently
    // parsing. Used to suppress the global `name → name_var` rewrite for
    // parameters that just happen to share a name with a user function.
    private isCurrentFunctionParam(name: string): boolean {
        for (const frame of this.paramScopes) {
            if (frame.has(name)) return true;
        }
        return false;
    }

    advance() {
        return this.tokens[this.pos++];
    }

    match(type, value = null) {
        const token = this.peek();
        if (token.type !== type) return false;
        if (value !== null && token.value !== value) return false;
        return true;
    }

    expect(type, value = null) {
        const token = this.peek();
        if (token.type !== type) {
            throw new Error(`Expected ${type} but got ${token.type} at ${token.line}:${token.column}${this.layoutHint(token)}`);
        }
        if (value !== null && token.value !== value) {
            throw new Error(`Expected '${value}' but got '${token.value}' at ${token.line}:${token.column}${this.layoutHint(token)}`);
        }
        return this.advance();
    }

    /**
     * Error for a token that cannot start / continue what is being parsed.
     * Two layout situations are baffling without context and get a specific
     * message: an INDENT where a statement was expected (the line is indented
     * as a local block, but nothing opened one), and a token the lexer joined
     * onto the previous line because of Pine's line-wrapping rule.
     */
    private unexpected(token: Token): Error {
        if (token.type === TokenType.INDENT) {
            // The INDENT token itself sits at the first non-blank column of the line.
            const first = this.tokens[this.tokens.indexOf(token) + 1] ?? token;
            return new Error(
                `Unexpected indentation at ${token.line}:${token.column} - '${first.value}' is indented as a local block, ` +
                    `but the previous statement does not open one. A line indented by a multiple of four columns starts a new ` +
                    `statement; to wrap a long line, indent the continuation by a number of columns that is not a multiple of four`
            );
        }
        const value = token.type === TokenType.NEWLINE ? 'end of line' : token.value;
        const column = token.wrapped ? token.wrapped.column : token.column;
        return new Error(`Unexpected token ${token.type} '${value}' at ${token.line}:${column}${this.layoutHint(token)}`);
    }

    /** Suffix explaining that `token` starts a line the lexer joined onto the previous one. */
    private layoutHint(token: Token): string {
        const w = token.wrapped;
        if (!w) return '';
        const why =
            w.width % 4 !== 0
                ? `is indented by ${w.width} columns, which is not a multiple of four, so it continues line ${w.fromLine} (Pine line wrapping)`
                : `continues line ${w.fromLine}, which ends with an operator`;
        return ` - line ${token.line} ${why}. A statement inside a local block must be indented by four spaces or one tab per level`;
    }

    /**
     * After a complete statement, the next token must start a new line. The
     * only way it cannot is when the lexer joined the following line onto
     * this one (indentation not a multiple of four) and the statement did not
     * absorb it: `    v := 1` followed by `      v := 2`. TradingView rejects
     * that ("Syntax error at input 'v'"); so do we, with the reason.
     *
     * A wrapped COMMA is left alone: `a = 0, b = 1` ⏎ ` , c = 2` continues the
     * statement sequence, which the caller consumes. Where a comma is not
     * valid it fails on its own, with the same layout hint.
     */
    private rejectDanglingWrappedLine() {
        const token = this.peek();
        if (token.wrapped && token.type !== TokenType.COMMA) throw this.unexpected(token);
    }

    /**
     * True when the current token is the first token of a new logical line:
     * the previous token (looking past DEDENTs) is a NEWLINE, or sits on an
     * earlier physical line without the current token being a lexer-joined
     * wrapped line.
     */
    private startsNewLine(): boolean {
        const token = this.peek();
        if (token.wrapped || token.grouped) return false;
        let i = this.pos - 1;
        while (i >= 0 && this.tokens[i].type === TokenType.DEDENT) i--;
        if (i < 0) return true;
        const prev = this.tokens[i];
        return prev.type === TokenType.NEWLINE || prev.line !== token.line;
    }

    /**
     * TradingView's error for a keyword or reserved word used where a new name
     * is declared (variable, function, parameter, UDT field, type or enum
     * name). `text`, `range`, `return`, ... carry no syntax of their own but
     * are still rejected here; `type`/`method`/`enum` never reach this point
     * because the lexer already downgraded them to identifiers outside their
     * declaration position.
     */
    private reservedNameError(token: Token): Error {
        // Word tokens carry the column just past their last character; report
        // the first character, where TradingView points.
        const column = token.column - String(token.value).length;
        return new Error(`"${token.value}" cannot be used as a variable or function name. at ${token.line}:${column}`);
    }

    private isReservedName(token: Token): boolean {
        return token.type === TokenType.KEYWORD || (token.type === TokenType.IDENTIFIER && ReservedWords.has(token.value));
    }

    /**
     * Consume the name being declared. Rejects keywords and reserved words
     * with TradingView's message; the lexer has already turned contextual
     * keywords (`type`, `method`, `enum`) into identifiers here.
     *
     * Not used for tuple destructuring targets (`[text, b] = f()`), which
     * TradingView accepts unchecked.
     */
    expectName(): Token {
        const token = this.peek();
        if (this.isReservedName(token)) {
            throw this.reservedNameError(token);
        }
        if (token.type !== TokenType.IDENTIFIER) {
            throw new Error(`Expected ${TokenType.IDENTIFIER} but got ${token.type} at ${token.line}:${token.column}`);
        }
        return this.advance();
    }

    /**
     * Same check for a declaration recognised only after its target was parsed
     * as an expression (`text = close` → VariableDeclaration). `startToken` is
     * the first token of the statement, where TradingView reports the error.
     */
    private assertDeclarableName(id: any, startToken: Token): void {
        if (id?.type === 'Identifier' && ReservedWords.has(id.name)) {
            throw this.reservedNameError(startToken);
        }
    }

    /**
     * A function parameter's default must be a literal or a built-in variable:
     * TradingView rejects calls (`a = input(14)`, `a = math.max(1, 2)`) and
     * calculations (`a = 2 + 2`). `startToken` is the parameter's first token,
     * where TradingView reports the error.
     */
    private assertParamDefault(value: any, startToken: Token): void {
        if (value?.type === 'CallExpression') {
            throw new Error(`The default value cannot be a function, variable or calculation. at ${this.startOf(startToken)}`);
        }
        if (value?.type === 'BinaryExpression' || value?.type === 'LogicalExpression' || value?.type === 'ConditionalExpression') {
            throw new Error(
                `The default value assigned to a parameter must be either a literal value (e.g., "5") or a built-in variable (e.g., "close"). at ${this.startOf(startToken)}`
            );
        }
    }

    /** `line:column` of a token's first character (tokens carry the column just past their end). */
    private startOf(token: Token): string {
        return `${token.line}:${token.column - String(token.value).length}`;
    }

    /** `ta.sma` for a callee built from identifiers only, otherwise null. */
    private dottedName(node: any): string | null {
        if (node?.type === 'Identifier') return node.name;
        if (node?.type === 'MemberExpression' && !node.computed && node.property?.type === 'Identifier') {
            const object = this.dottedName(node.object);
            return object === null ? null : `${object}.${node.property.name}`;
        }
        return null;
    }

    /** Tuple size returned by a call to a user function, when statically known. */
    private tupleArityOf(init: any): number | undefined {
        if (init?.type !== 'CallExpression' || init.callee?.type !== 'Identifier') return undefined;
        return this.functionTupleArity.get(init.callee.name) ?? undefined;
    }

    /** Pine has no tuple literals outside a local block's return value: `u = [a, b]`, `[u, v] = [a, b]`. */
    private assertNotTupleLiteral(init: any): void {
        if (init?.type === 'ArrayExpression') {
            const open = this.tupleLiteralStart.get(init);
            throw new Error(`Syntax error at input "["${open ? ` at ${this.startOf(open)}` : ''}`);
        }
    }

    /** `u = f()` where `f` returns a tuple, or `u = [a, b]`: TradingView rejects the declaration. */
    private assertNotTupleAssignment(id: any, init: any, startToken: Token): void {
        this.assertNotTupleLiteral(init);
        if (id?.type === 'Identifier' && this.tupleArityOf(init) !== undefined) {
            throw new Error(`Invalid assignment. Cannot assign a tuple to a variable "${id.name}". at ${this.startOf(startToken)}`);
        }
    }

    /**
     * `keyword = expr` at statement start (`in = close`, `import = 1`): the
     * expression parser would only report a generic unexpected-token error;
     * TradingView reports the reserved-name error instead.
     */
    private rejectReservedAssignmentTarget(): void {
        const token = this.peek();
        const next = this.peek(1);
        if (this.isReservedName(token) && next.type === TokenType.OPERATOR && next.value === '=') {
            throw this.reservedNameError(token);
        }
    }

    /**
     * IDENTIFIER, or a keyword sitting where a declared name belongs (so the
     * declaration parser can reject it with the reserved-name error). Keywords
     * that open their own statement are excluded so lookaheads never mistake
     * `if (...)` / `switch (...)` for a declaration.
     */
    private isNameSlot(token: Token): boolean {
        if (token.type === TokenType.IDENTIFIER) return true;
        return token.type === TokenType.KEYWORD && !Parser.STATEMENT_KEYWORDS.has(token.value);
    }

    private static readonly STATEMENT_KEYWORDS = new Set(['if', 'else', 'for', 'while', 'switch']);

    // Peek for a binary operator at the current position (non-consuming).
    // Returns the operator value if found, null otherwise.
    //
    // Line wrapping is resolved by the lexer: a wrapped line (indentation that
    // is not a multiple of four, or one that follows a trailing operator) is
    // joined onto the previous line and never produces a NEWLINE token. So a
    // NEWLINE here always ends the expression — `x = 1` / `-x` on the next
    // line at the block indent is a unary statement, exactly as on TradingView,
    // not `x = 1 - x`.
    peekOperatorEx(validOps: string[]) {
        const token = this.peek();
        if (token.type !== TokenType.OPERATOR) return null;
        if (!validOps.includes(token.value)) return null;
        return token.value;
    }

    // Newline and comment tokens carry no syntax of their own.
    isLayoutToken() {
        return this.match(TokenType.NEWLINE) || this.match(TokenType.COMMENT);
    }

    skipNewlines(allowIndent = false) {
        while (this.isLayoutToken()) this.advance();
        if (allowIndent && this.match(TokenType.INDENT)) {
            this.advance();
        }
    }

    // Main parse method
    parse() {
        const body = [];

        this.collectTopLevelFunctionNames();

        while (!this.match(TokenType.EOF)) {
            this.skipNewlines();
            
            // Handle DEDENTs at top level (from line continuations)
            if (this.match(TokenType.DEDENT)) {
                this.advance();
                continue;
            }

            if (this.match(TokenType.EOF)) break;

            const stmt = this.parseStatement();
            if (stmt) body.push(stmt);

            this.skipNewlines();
        }

        return new Program(body);
    }

    // Pine keeps functions and variables in separate namespaces, so a variable may
    // share a function's name even when it is declared before the function.
    private collectTopLevelFunctionNames() {
        let depth = 0;
        for (let i = 0; i < this.tokens.length; i++) {
            const t = this.tokens[i];
            if (t.type === TokenType.INDENT) depth++;
            else if (t.type === TokenType.DEDENT) depth--;
            const atLineStart = i === 0 || this.tokens[i - 1].type === TokenType.NEWLINE || this.tokens[i - 1].type === TokenType.DEDENT;
            if (depth !== 0 || !atLineStart || t.type !== TokenType.IDENTIFIER) continue;
            this.pos = i;
            if (!this.isFunctionDeclaration()) continue;
            const hasReturnType = this.peek(1).type !== TokenType.LPAREN;
            this.functionNames.add(this.peek(hasReturnType ? 1 : 0).value);
        }
        this.pos = 0;
    }

    // Parse statement
    parseStatement(handleCommas = true) {
        this.skipNewlines();

        const startLine = this.peek().line;

        // Skip comments
        if (this.match(TokenType.COMMENT)) {
            this.advance();
            return null;
        }

        let stmt;

        // Enum definition
        if (this.match(TokenType.KEYWORD, 'enum')) {
            stmt = this.parseEnumDefinition();
        }
        // Type definition
        else if (this.match(TokenType.KEYWORD, 'type')) {
            stmt = this.parseTypeDefinition();
        }
        // Variable declaration (var/varip)
        else if (this.match(TokenType.KEYWORD, 'var') || this.match(TokenType.KEYWORD, 'varip')) {
            stmt = this.parseVarDeclaration();
        }
        // Method declaration
        else if (this.match(TokenType.KEYWORD, 'method')) {
            stmt = this.parseMethodDeclaration();
        }
        // Function declaration
        else if (this.isFunctionDeclaration()) {
            stmt = this.parseFunctionDeclaration();
        }
        // If statement
        else if (this.match(TokenType.KEYWORD, 'if')) {
            stmt = this.parseIfStatement();
        }
        // For loop
        else if (this.match(TokenType.KEYWORD, 'for')) {
            stmt = this.parseForStatement();
        }
        // While loop
        else if (this.match(TokenType.KEYWORD, 'while')) {
            stmt = this.parseWhileStatement();
        }
        // Break/continue statements
        else if (this.match(TokenType.KEYWORD, 'break') || this.match(TokenType.KEYWORD, 'continue')) {
            const keyword = this.advance().value;
            stmt = new ExpressionStatement(new Identifier(keyword));
        }
        // Tuple destructuring [a, b] = ...
        else if (this.isTupleDestructuring()) {
            stmt = this.parseTupleDestructuring();
        }
        // Check for typed variable declaration (type identifier = ...)
        // Pattern: IDENTIFIER IDENTIFIER OPERATOR(=)
        // Also handles: IDENTIFIER IDENTIFIER IDENTIFIER OPERATOR(=) for multi-qualifier types
        // Also handles: IDENTIFIER[] IDENTIFIER OPERATOR(=) for array shorthand (float[] x = ...)
        // Also handles: IDENTIFIER<...> IDENTIFIER OPERATOR(=) for generic types (array<float> x = ...)
        else if (this.peek().type === TokenType.IDENTIFIER && this.isTypedVarDeclaration()) {
            stmt = this.parseTypedVarDeclaration();
        }

        if (!stmt) {
            // Expression or assignment
            this.rejectReservedAssignmentTarget();
            const startToken = this.peek();
            const expr = this.parseExpression();

            // Check for assignment
            if (this.match(TokenType.OPERATOR)) {
                const op = this.peek().value;
                if (['=', ':=', '+=', '-=', '*=', '/=', '%='].includes(op)) {
                    this.advance();
                    this.skipNewlines(true);
                    const right = this.parseExpression();

                    // Simple assignment with = creates variable declaration
                    if (op === '=' && expr.type === 'Identifier') {
                        this.assertDeclarableName(expr, startToken);
                        this.assertNotTupleAssignment(expr, right, startToken);
                        stmt = new VariableDeclaration([new VariableDeclarator(expr, right)], VariableDeclarationKind.LET);
                    } else {
                        // Other assignments
                        stmt = new ExpressionStatement(new AssignmentExpression(op === ':=' ? '=' : op, expr, right));
                    }
                } else {
                    stmt = new ExpressionStatement(expr);
                }
            } else {
                stmt = new ExpressionStatement(expr);
            }
        }

        // Attach line number to statement
        if (stmt) {
            stmt._line = startLine;
            
            // Handle comma-separated statements on the same logical line: a = high, b = low
            // Only handle commas at the top level (not in recursive calls).
            // A COMMA directly after a complete statement is on the same logical
            // line by construction (a NEWLINE token would otherwise sit between
            // them), even if the statement spanned wrapped lines or a multi-line
            // call: `x = f(a,` ⏎ `    b), y = 2`.
            if (handleCommas && this.match(TokenType.COMMA)) {
                const statements = [stmt];
                
                while (this.match(TokenType.COMMA)) {
                    this.advance(); // consume comma
                    this.skipNewlines(true); // skip any whitespace after comma
                    
                    // Parse the next statement on the same line (don't handle commas recursively)
                    const nextStmt = this.parseStatement(false);
                    if (nextStmt) {
                        statements.push(nextStmt);
                    }
                }
                
                // Return a BlockStatement containing all comma-separated statements
                this.rejectDanglingWrappedLine();
                return new BlockStatement(statements);
            }
        }

        this.rejectDanglingWrappedLine();
        return stmt;
    }

    // Check if current position is function declaration
    isFunctionDeclaration() {
        const saved = this.pos;
        try {
            // Pattern: [type] identifier(...) =>
            // A keyword in the name slot (`in(x) => x`) is accepted by the
            // lookahead so parseFunctionDeclaration can report it as a
            // reserved name rather than a generic syntax error.
            let i = 0;

            // Optional return type
            if (this.peek(i).type === TokenType.IDENTIFIER && this.isNameSlot(this.peek(i + 1))) {
                i++; // Skip return type
            }

            // Function name
            if (!this.isNameSlot(this.peek(i))) {
                return false;
            }
            i++;

            // Opening paren
            if (this.peek(i).type !== TokenType.LPAREN) {
                return false;
            }
            i++;

            // Skip parameters
            let depth = 1;
            while (depth > 0 && this.peek(i).type !== TokenType.EOF) {
                if (this.peek(i).type === TokenType.LPAREN) depth++;
                if (this.peek(i).type === TokenType.RPAREN) depth--;
                i++;
            }

            return this.peek(i).type === TokenType.OPERATOR && this.peek(i).value === '=>';
        } finally {
            this.pos = saved;
        }
    }

    // Parse type definition (v5: type X => fields, v6: type X\n fields)
    // Parse type expression with support for generics (e.g., array<float>, map<string, int>)
    parseTypeExpression() {
        // Parse base type (e.g., "array", "matrix", "map", "float", "chart.point")
        let baseType = this.expect(TokenType.IDENTIFIER).value;

        // Handle dotted type names: chart.point, line.style, etc.
        while (this.match(TokenType.DOT) && this.peek(1).type === TokenType.IDENTIFIER) {
            this.advance(); // consume .
            baseType += '.' + this.advance().value; // consume identifier
        }

        // Check for generic parameters: array<float>, map<string, float>
        if (this.match(TokenType.OPERATOR, '<')) {
            this.advance(); // consume '<'

            const typeArgs = [];

            // Parse first type argument (recursive for nested generics)
            typeArgs.push(this.parseTypeExpression());

            // Parse additional type arguments (for map<K, V>)
            while (this.match(TokenType.COMMA)) {
                this.advance();
                this.skipNewlines();
                typeArgs.push(this.parseTypeExpression());
            }

            this.expect(TokenType.OPERATOR, '>'); // consume '>'

            // Return as string representation: "array<float>"
            return baseType + '<' + typeArgs.join(', ') + '>';
        }

        // Handle shorthand array syntax: int[] or int [] (with optional space)
        // Pine Script allows both `int[]` and `int []` as array type notation
        if (this.match(TokenType.LBRACKET) && this.peek(1).type === TokenType.RBRACKET) {
            this.advance(); // consume '['
            this.advance(); // consume ']'
            return 'array<' + baseType + '>';
        }

        return baseType; // Simple type: "float", "int", etc.
    }

    // Parse enum definition. Supports both Pine v6 forms:
    //   enum X            (untitled — bare member names)
    //       a
    //       b
    //   enum Y            (titled — `member = "title"`)
    //       a = "Alpha"
    //       b = "Beta"
    //
    // Runtime value matches TradingView's str.tostring(EnumName.member):
    //   - titled: the title string verbatim (incl. empty `""`)
    //   - untitled: just the member name (e.g. "a", NOT "X.a")
    parseEnumDefinition() {
        this.expect(TokenType.KEYWORD, 'enum');
        const name = this.expectName().value;

        this.skipNewlines();
        this.expect(TokenType.INDENT);

        const members: { name: string; title: string | null }[] = [];
        while (!this.match(TokenType.DEDENT) && !this.match(TokenType.EOF)) {
            this.skipNewlines();
            if (this.match(TokenType.DEDENT)) break;
            if (this.match(TokenType.COMMENT)) {
                this.advance();
                continue;
            }

            const memberName = this.expectName().value;
            let memberTitle: string | null = null;
            if (this.match(TokenType.OPERATOR, '=')) {
                this.advance(); // consume '='
                memberTitle = this.expect(TokenType.STRING).value;
            }
            members.push({ name: memberName, title: memberTitle });
            this.skipNewlines();
        }

        if (this.match(TokenType.DEDENT)) {
            this.advance();
        }

        // Generate: const Name = { member: title-or-name, ... }
        const props = members.map((m) =>
            new Property(new Identifier(m.name), new Literal(m.title !== null ? m.title : m.name)),
        );
        const objExpr = new ObjectExpression(props);
        return new VariableDeclaration(
            [new VariableDeclarator(new Identifier(name), objExpr)],
            VariableDeclarationKind.CONST
        );
    }

    parseTypeDefinition() {
        this.expect(TokenType.KEYWORD, 'type');
        const name = this.expectName().value;

        // Check for => (v5 syntax)
        const hasArrow = this.match(TokenType.OPERATOR, '=>');
        if (hasArrow) {
            this.advance();
        }

        this.skipNewlines();
        this.expect(TokenType.INDENT);

        const fields = [];
        while (!this.match(TokenType.DEDENT) && !this.match(TokenType.EOF)) {
            this.skipNewlines();
            if (this.match(TokenType.DEDENT)) break;

            // Parse field: type name [= defaultValue]
            const fieldType = this.parseTypeExpression(); // Now handles generics
            // Field names may be contextual keywords (`int type = 0`) — the lexer
            // already delivers them as identifiers here; reserved words are rejected.
            const fieldName = this.expectName().value;

            let defaultValue = null;
            if (this.match(TokenType.OPERATOR, '=')) {
                this.advance();
                this.skipNewlines();
                defaultValue = this.parseExpression();
            }

            fields.push({ type: fieldType, name: fieldName, defaultValue });
            this.skipNewlines();
        }

        if (this.match(TokenType.DEDENT)) {
            this.advance();
        }

        return new TypeDefinition(name, fields);
    }

    // Parse var/varip declaration
    parseVarDeclaration() {
        const keyword = this.advance();
        const kind = keyword.value; // 'var' or 'varip'

        let varType = null;
        let name = null;

        // `var const int x = 1` — a type qualifier may sit between the keyword and the type.
        if (
            this.peek().type === TokenType.IDENTIFIER &&
            ['const', 'simple', 'series'].includes(this.peek().value) &&
            this.peek(1).type === TokenType.IDENTIFIER
        ) {
            this.advance();
        }

        // Check for type: var type name = ... or var name = ...
        // Pattern 1: var IDENTIFIER IDENTIFIER = ... (typed)
        // Pattern 2: var IDENTIFIER [] IDENTIFIER = ... (typed with array syntax)
        // Pattern 3: var IDENTIFIER = ... (untyped)

        // Look ahead to determine if this is typed or untyped
        // If peek(0) is IDENTIFIER and peek(1) is [, it's typed with array syntax
        // If peek(0) is IDENTIFIER and peek(1) is <, it's typed with generic syntax
        // If peek(0) is IDENTIFIER and peek(1) is IDENTIFIER, it's typed
        // If peek(0) is IDENTIFIER and peek(1) is =, it's untyped

        if (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.LBRACKET && this.peek(2).type === TokenType.RBRACKET) {
            // Pattern 2: var type[] name = ...
            varType = this.advance().value;
            this.advance(); // [
            varType += '[]';
            this.advance(); // ]
            name = this.expectName().value;
        } else if (
            this.peek().type === TokenType.IDENTIFIER &&
            (this.peek(1).type === TokenType.DOT || this.isNameSlot(this.peek(1)) || (this.peek(1).type === TokenType.OPERATOR && this.peek(1).value === '<'))
        ) {
            // Has type: var type name = ..., var type<generic> name = ..., or var ns.type name = ...
            varType = this.advance().value;

            // Handle dotted type names: chart.point, line.style, etc.
            while (this.match(TokenType.DOT) && this.peek(1).type === TokenType.IDENTIFIER) {
                this.advance(); // consume .
                varType += '.' + this.advance().value; // consume identifier
            }

            // Handle array shorthand after dotted type: chart.point[] name = ...
            if (this.match(TokenType.LBRACKET) && this.peek(1).type === TokenType.RBRACKET) {
                this.advance(); // consume [
                this.advance(); // consume ]
                varType += '[]';
                name = this.expectName().value;
            }
            // Handle generic type syntax: array<float>, map<string, int>, etc.
            else if (this.match(TokenType.OPERATOR, '<')) {
                this.advance(); // consume <
                varType += '<';

                // Read generic type parameter(s)
                while (!this.match(TokenType.OPERATOR, '>')) {
                    if (this.match(TokenType.IDENTIFIER)) {
                        varType += this.advance().value;
                        // Handle dotted types inside generics: map<string, chart.point>
                        while (this.match(TokenType.DOT) && this.peek(1).type === TokenType.IDENTIFIER) {
                            varType += '.';
                            this.advance(); // consume .
                            varType += this.advance().value; // consume identifier
                        }
                    } else if (this.match(TokenType.COMMA)) {
                        varType += this.advance().value;
                        this.skipNewlines();
                    } else {
                        break;
                    }
                }

                if (this.match(TokenType.OPERATOR, '>')) {
                    varType += '>';
                    this.advance();
                }

                name = this.expectName().value;
            } else {
                name = this.expectName().value;
            }
        } else if (this.isNameSlot(this.peek())) {
            // No type: var name = ... (a keyword here is reported as a reserved name)
            name = this.expectName().value;
        } else if (this.match(TokenType.OPERATOR, '=') || this.match(TokenType.LPAREN)) {
            // `var = close` / `var(x) => x` — the keyword itself used as a name.
            throw this.reservedNameError(keyword);
        } else {
            throw new Error(`Expected identifier after ${kind} at ${this.peek().line}:${this.peek().column}`);
        }

        if (this.functionNames.has(name)) {
            name = name + '_var';
        }

        this.expect(TokenType.OPERATOR, '=');
        this.skipNewlines(true);
        const init = this.parseExpression();

        const id = new Identifier(name);
        if (varType) {
            id.varType = varType;
        }

        const declarators = [new VariableDeclarator(id, init, varType)];

        // Handle comma-separated var declarations on the same line:
        //   var int dir = na, var int x1 = na, var float y1 = na
        // Each segment after the comma is a full "var type name = expr".
        while (
            this.match(TokenType.COMMA) &&
            this.peek(1).type === TokenType.KEYWORD &&
            (this.peek(1).value === 'var' || this.peek(1).value === 'varip')
        ) {
            this.advance(); // consume ','
            // Recursively parse the next "var type name = expr" segment
            const extraDecl = this.parseVarDeclaration();
            // Merge declarators from the recursively parsed declaration
            declarators.push(...extraDecl.declarations);
        }

        return new VariableDeclaration(declarators, kind);
    }

    // Lookahead to detect typed variable declaration patterns:
    //   IDENTIFIER IDENTIFIER ... IDENTIFIER = (simple: int x =, series float x =)
    //   IDENTIFIER [] IDENTIFIER = (array shorthand: float[] x =)
    //   IDENTIFIER <...> IDENTIFIER = (generic: array<float> x =)
    //   IDENTIFIER.IDENTIFIER[] IDENTIFIER = (dotted array: chart.point[] x =)
    //   IDENTIFIER.IDENTIFIER<...> IDENTIFIER = (dotted generic: map<string, chart.point> x =)
    isTypedVarDeclaration() {
        let offset = 0;

        // First token must be IDENTIFIER (already checked by caller)
        if (this.peek(offset).type !== TokenType.IDENTIFIER) return false;
        offset++;

        // Skip dotted type name: chart.point, line.style, etc.
        while (this.peek(offset).type === TokenType.DOT && this.peek(offset + 1).type === TokenType.IDENTIFIER) {
            offset += 2; // skip . and IDENTIFIER
        }

        // Check for array shorthand: type[] name =
        // (A keyword in the name slot is accepted here and in the branches
        // below so parseTypedVarDeclaration reports it as a reserved name.)
        if (this.peek(offset).type === TokenType.LBRACKET && this.peek(offset + 1).type === TokenType.RBRACKET) {
            offset += 2; // skip []
            // Now expect IDENTIFIER (name) then =
            if (!this.isNameSlot(this.peek(offset))) return false;
            offset++;
            return this.peek(offset).type === TokenType.OPERATOR && this.peek(offset).value === '=';
        }

        // Check for generic type: type<...> name =
        if (this.peek(offset).type === TokenType.OPERATOR && this.peek(offset).value === '<') {
            offset++; // skip <
            let depth = 1;
            // Skip until matching >
            while (depth > 0 && this.peek(offset).type !== TokenType.EOF) {
                if (this.peek(offset).type === TokenType.OPERATOR && this.peek(offset).value === '<') depth++;
                else if (this.peek(offset).type === TokenType.OPERATOR && this.peek(offset).value === '>') depth--;
                offset++;
            }
            // Now expect IDENTIFIER (name) then =
            if (!this.isNameSlot(this.peek(offset))) return false;
            offset++;
            return this.peek(offset).type === TokenType.OPERATOR && this.peek(offset).value === '=';
        }

        // Check for simple typed declaration: type name = or type qualifier name =
        if (!this.isNameSlot(this.peek(offset))) return false;
        offset++;
        // Skip additional type qualifiers (series float x, simple int y, etc.)
        while (this.isNameSlot(this.peek(offset))) {
            offset++;
        }
        return this.peek(offset).type === TokenType.OPERATOR && this.peek(offset).value === '=';
    }

    // Parse typed variable declaration (int x = ... or series float x = ...)
    // Also handles: type[] name = ..., type<generic> name = ..., ns.type[] name = ...
    parseTypedVarDeclaration() {
        let varType = this.advance().value;

        // Handle dotted type names: chart.point, line.style, etc.
        while (this.match(TokenType.DOT) && this.peek(1).type === TokenType.IDENTIFIER) {
            this.advance(); // consume .
            varType += '.' + this.advance().value; // consume identifier
        }

        // Handle array shorthand: type[] name = ...
        if (this.match(TokenType.LBRACKET) && this.peek(1).type === TokenType.RBRACKET) {
            this.advance(); // consume [
            this.advance(); // consume ]
            varType += '[]';
        }
        // Handle generic type: type<...> name = ...
        else if (this.match(TokenType.OPERATOR, '<')) {
            this.advance(); // consume <
            varType += '<';

            // Read generic type parameter(s)
            while (!this.match(TokenType.OPERATOR, '>')) {
                if (this.match(TokenType.IDENTIFIER)) {
                    varType += this.advance().value;
                    // Handle dotted types inside generics: array<chart.point>
                    while (this.match(TokenType.DOT) && this.peek(1).type === TokenType.IDENTIFIER) {
                        varType += '.';
                        this.advance(); // consume .
                        varType += this.advance().value; // consume identifier
                    }
                } else if (this.match(TokenType.COMMA)) {
                    varType += this.advance().value;
                    this.skipNewlines();
                } else {
                    break;
                }
            }

            if (this.match(TokenType.OPERATOR, '>')) {
                varType += '>';
                this.advance();
            }
        }
        // Handle multi-qualifier types (series float, simple int, etc.)
        else {
            while (this.peek().type === TokenType.IDENTIFIER && this.isNameSlot(this.peek(1))) {
                varType += ' ' + this.advance().value;
            }
        }

        let name = this.expectName().value;
        if (this.functionNames.has(name)) {
            name = name + '_var';
        }

        this.expect(TokenType.OPERATOR, '=');
        this.skipNewlines(true);
        const init = this.parseExpression();

        const id = new Identifier(name);
        id.varType = varType;

        const declarators = [new VariableDeclarator(id, init, varType)];

        // Handle comma-separated typed declarations sharing the same type:
        //   float a = 0.0, b = 1.0, c = 2.0
        //   int x = 1, y = 2
        //   array<float> p = na, q = na
        // Each subsequent segment is `name = expr` with the leading type reapplied.
        // The guard requires `, IDENT =` so we don't greedily swallow commas
        // that belong to a separate full declaration on the same line, e.g.
        //   chart.point[] a = ..., chart.point[] b = ...
        // (`peek(2)` would be DOT/LBRACKET/IDENT, not `=`). Those flow up to
        // the multi-statement handler in parseStatement (Layer 2).
        while (
            this.match(TokenType.COMMA) &&
            this.peek(1).type === TokenType.IDENTIFIER &&
            this.peek(2).type === TokenType.OPERATOR &&
            this.peek(2).value === '='
        ) {
            this.advance(); // consume ','
            this.skipNewlines(true);
            let nextName = this.expectName().value;
            if (this.functionNames.has(nextName)) {
                nextName = nextName + '_var';
            }
            this.expect(TokenType.OPERATOR, '=');
            this.skipNewlines(true);
            const nextInit = this.parseExpression();
            const nextId = new Identifier(nextName);
            nextId.varType = varType;
            declarators.push(new VariableDeclarator(nextId, nextInit, varType));
        }

        return new VariableDeclaration(declarators, VariableDeclarationKind.LET);
    }

    // Parse function declaration
    parseFunctionDeclaration() {
        let returnType = null;
        if (this.peek().type === TokenType.IDENTIFIER && this.isNameSlot(this.peek(1))) {
            returnType = this.advance().value;
        }

        const name = this.expectName().value;
        this.functionNames.add(name);

        this.expect(TokenType.LPAREN);

        const params = [];
        while (!this.match(TokenType.RPAREN)) {
            this.skipNewlines();
            if (this.match(TokenType.RPAREN)) break;

            const paramStart = this.peek();
            let paramType = null;

            // Handle type qualifiers (can be multiple: series float, simple int, etc.)
            while (
                this.peek().type === TokenType.IDENTIFIER &&
                this.peek(1).type === TokenType.IDENTIFIER &&
                this.peek(2).type !== TokenType.LPAREN
            ) {
                if (paramType) {
                    paramType += ' ';
                }
                paramType = (paramType || '') + this.advance().value;
            }

            // Handle generic type: array<float>, map<string, float>, etc.
            if (
                this.peek().type === TokenType.IDENTIFIER &&
                this.peek(1).type === TokenType.OPERATOR && this.peek(1).value === '<'
            ) {
                const genericType = this.parseTypeExpression();
                paramType = paramType ? paramType + ' ' + genericType : genericType;
            }

            // Handle array shorthand: int[], float[], line[], label[], etc.
            if (
                this.peek().type === TokenType.IDENTIFIER &&
                this.peek(1).type === TokenType.LBRACKET &&
                this.peek(2).type === TokenType.RBRACKET
            ) {
                const arrayType = this.parseTypeExpression();
                paramType = paramType ? paramType + ' ' + arrayType : arrayType;
            }

            const paramName = this.expectName().value;
            const param = new Identifier(paramName);
            if (paramType) param.varType = paramType;

            // Handle default parameters
            if (this.match(TokenType.OPERATOR, '=')) {
                this.advance();
                this.skipNewlines();
                const defaultValue = this.parseExpression();
                this.assertParamDefault(defaultValue, paramStart);
                params.push(new AssignmentPattern(param, defaultValue));
            } else {
                params.push(param);
            }

            if (this.match(TokenType.COMMA)) {
                this.advance();
            }
        }

        this.expect(TokenType.RPAREN);
        this.skipNewlines();
        this.expect(TokenType.OPERATOR, '=>');
        this.skipNewlines();

        const paramFrame = new Set<string>();
        for (const p of params) {
            const ident = p.type === 'AssignmentPattern' ? (p as any).left : p;
            if (ident && ident.name) paramFrame.add(ident.name);
        }
        this.paramScopes.push(paramFrame);
        let body: BlockStatement;
        try {
            body = this.parseFunctionBody();
        } finally {
            this.paramScopes.pop();
        }
        const id = new Identifier(name);
        if (returnType) id.returnType = returnType;

        const last = body.body[body.body.length - 1];
        const returned = last?.type === 'ReturnStatement' ? last.argument : null;
        const arity = returned?.type === 'ArrayExpression' ? returned.elements.length : this.tupleArityOf(returned) ?? null;
        this.functionTupleArity.set(name, this.functionTupleArity.has(name) && this.functionTupleArity.get(name) !== arity ? null : arity);
        this.functionParamNames.set(name, this.functionParamNames.has(name) ? null : [...paramFrame]);

        return new FunctionDeclaration(id, params, body, returnType);
    }

    // Parse method declaration (method name(Type this, params) => ...)
    parseMethodDeclaration() {
        this.expect(TokenType.KEYWORD, 'method');

        let returnType = null;
        if (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.IDENTIFIER && this.peek(2).type === TokenType.LPAREN) {
            returnType = this.advance().value;
        }

        const name = this.expectName().value;
        this.expect(TokenType.LPAREN);

        const params = [];
        while (!this.match(TokenType.RPAREN)) {
            this.skipNewlines();
            if (this.match(TokenType.RPAREN)) break;

            const paramStart = this.peek();
            let paramType = null;

            // Handle type qualifiers (can be multiple: series float, simple int, etc.)
            while (
                this.peek().type === TokenType.IDENTIFIER &&
                this.peek(1).type === TokenType.IDENTIFIER &&
                this.peek(2).type !== TokenType.LPAREN
            ) {
                if (paramType) {
                    paramType += ' ';
                }
                paramType = (paramType || '') + this.advance().value;
            }

            // Handle generic type: array<float>, map<string, float>, etc.
            if (
                this.peek().type === TokenType.IDENTIFIER &&
                this.peek(1).type === TokenType.OPERATOR && this.peek(1).value === '<'
            ) {
                const genericType = this.parseTypeExpression();
                paramType = paramType ? paramType + ' ' + genericType : genericType;
            }

            // Handle array shorthand: int[], float[], line[], label[], etc.
            if (
                this.peek().type === TokenType.IDENTIFIER &&
                this.peek(1).type === TokenType.LBRACKET &&
                this.peek(2).type === TokenType.RBRACKET
            ) {
                const arrayType = this.parseTypeExpression();
                paramType = paramType ? paramType + ' ' + arrayType : arrayType;
            }

            const paramName = this.expectName().value;
            const param = new Identifier(paramName);
            if (paramType) param.varType = paramType;

            // Handle default parameters
            if (this.match(TokenType.OPERATOR, '=')) {
                this.advance();
                this.skipNewlines();
                const defaultValue = this.parseExpression();
                this.assertParamDefault(defaultValue, paramStart);
                params.push(new AssignmentPattern(param, defaultValue));
            } else {
                params.push(param);
            }

            if (this.match(TokenType.COMMA)) {
                this.advance();
            }
        }

        this.expect(TokenType.RPAREN);
        this.skipNewlines();
        this.expect(TokenType.OPERATOR, '=>');
        this.skipNewlines();

        const paramFrame = new Set<string>();
        for (const p of params) {
            const ident = p.type === 'AssignmentPattern' ? (p as any).left : p;
            if (ident && ident.name) paramFrame.add(ident.name);
        }
        this.paramScopes.push(paramFrame);
        let body: BlockStatement;
        try {
            body = this.parseFunctionBody();
        } finally {
            this.paramScopes.pop();
        }
        const id = new Identifier(name);
        if (returnType) id.returnType = returnType;
        id.isMethod = true; // Mark as method

        return new FunctionDeclaration(id, params, body, returnType);
    }

    // Parse function body (handles both single expression and block)
    parseFunctionBody() {
        const statements = [];

        // Single-line body (no INDENT). It is not necessarily a bare expression:
        // `f(a) => b = a * 2` and `f(a) => b = a * 2, c = b + 1, b + c` are both valid
        // Pine, so route it through the same statement/sequence parser as a block body.
        if (!this.match(TokenType.INDENT)) {
            const stmts = this.parseStatementOrSequence();
            const body = Array.isArray(stmts) ? stmts : stmts ? [stmts] : [];
            if (body.length > 0) this._addImplicitReturn(body);
            return new BlockStatement(body);
        }

        this.advance(); // consume INDENT

        while (!this.match(TokenType.DEDENT) && !this.match(TokenType.EOF)) {
            this.skipNewlines();
            if (this.match(TokenType.DEDENT)) break;

            // Check for comma-separated sequence (inline tuple return)
            // Pattern: var = expr, var = expr, ..., finalExpr
            const stmts = this.parseStatementOrSequence();
            if (Array.isArray(stmts)) {
                statements.push(...stmts);
            } else if (stmts) {
                statements.push(stmts);
            }
        }

        if (this.match(TokenType.DEDENT)) {
            this.advance();
        }

        // Make last statement a return if it's an expression.
        // For if/else/switch as the last statement, recursively add return to each branch.
        if (statements.length > 0) {
            this._addImplicitReturn(statements);
        }

        return new BlockStatement(statements);
    }

    /**
     * Recursively convert the last statement in a statement list to a ReturnStatement.
     *
     * A Pine function evaluates to the value of its last statement, whatever kind of
     * statement that is — not just a bare expression. `f(a) =>\n    b = a * 2` returns
     * `a * 2` on TradingView, and a trailing loop returns whatever its body produced on
     * the final iteration. Handles if/else chains by adding a return to each branch.
     */
    private _addImplicitReturn(statements: any[]): void {
        const last = statements[statements.length - 1];
        if (last.type === 'ForStatement' || last.type === 'WhileStatement') {
            this._addImplicitReturnToLoop(statements);
        } else {
            this._emitLastValue(statements, (value) => new ReturnStatement(value));
        }
    }

    /**
     * Give a trailing loop a value: Pine yields whatever the loop body's last statement
     * produced on its final iteration, or na when the body never ran (or the final
     * iteration skipped it). Captures that into a temp reset at the top of each iteration.
     */
    private _addImplicitReturnToLoop(statements: any[]): void {
        const loop = statements[statements.length - 1];
        if (loop.body?.type !== 'BlockStatement' || loop.body.body.length === 0) return;

        const tmp = `__loopValue_${this.loopValueCounter++}`;
        const na = () => new Identifier('na');
        const assignTmp = (value: any) => new ExpressionStatement(new AssignmentExpression('=', new Identifier(tmp), value));

        if (!this._emitLastValue(loop.body.body, assignTmp)) return;
        loop.body.body.unshift(assignTmp(na()));
        statements.splice(statements.length - 1, 0, new VariableDeclaration([new VariableDeclarator(new Identifier(tmp), na())], VariableDeclarationKind.LET));
        statements.push(new ReturnStatement(new Identifier(tmp)));
    }

    /**
     * Rewrite the last statement of `statements` so its value flows into `emit`
     * (a `return`, or an assignment to a temp). Recurses into if/else branches.
     * Returns false when the last statement has no usable value (`break`, a loop, …).
     */
    private _emitLastValue(statements: any[], emit: (value: any) => any): boolean {
        const last = statements[statements.length - 1];
        if (last.type === 'ExpressionStatement') {
            const expr = last.expression;
            if (expr?.type === 'Identifier' && (expr.name === 'break' || expr.name === 'continue')) return false;
            // An assignment's value is the assigned variable; read it back rather than
            // nesting the assignment inside the emitted statement.
            if (expr?.type === 'AssignmentExpression' && expr.left?.type === 'Identifier') {
                statements.push(emit(new Identifier(expr.left.name)));
            } else {
                statements[statements.length - 1] = emit(expr);
            }
            return true;
        }
        if (last.type === 'VariableDeclaration') {
            const declarator = last.declarations[last.declarations.length - 1];
            if (declarator?.id?.type !== 'Identifier') return false;
            statements.push(emit(new Identifier(declarator.id.name)));
            return true;
        }
        if (last.type === 'IfStatement') {
            let emitted = false;
            for (let branch = last; branch; branch = branch.alternate?.type === 'IfStatement' ? branch.alternate : null) {
                const blocks = [branch.consequent, branch.alternate?.type === 'BlockStatement' ? branch.alternate : null];
                for (const block of blocks) {
                    if (block?.body?.length > 0) emitted = this._emitLastValue(block.body, emit) || emitted;
                }
            }
            return emitted;
        }
        return false;
    }

    // Parse statement or comma-separated sequence
    parseStatementOrSequence() {
        const startPos = this.pos;
        const startLine = this.peek().line;

        // Check for control flow statements
        if (this.match(TokenType.KEYWORD, 'if')) {
            const stmt = this.parseIfStatement();
            if (stmt) stmt._line = startLine;
            return stmt;
        }

        if (this.match(TokenType.KEYWORD, 'for')) {
            return this.parseForStatement();
        }

        if (this.match(TokenType.KEYWORD, 'while')) {
            return this.parseWhileStatement();
        }

        if (this.match(TokenType.KEYWORD, 'break') || this.match(TokenType.KEYWORD, 'continue')) {
            const keyword = this.advance().value;
            return new ExpressionStatement(new Identifier(keyword));
        }

        // Check for var/varip declarations (can appear in function bodies)
        if (this.match(TokenType.KEYWORD, 'var') || this.match(TokenType.KEYWORD, 'varip')) {
            return this.parseVarDeclaration();
        }

        // Tuple destructuring [a, b] = ...
        if (this.isTupleDestructuring()) {
            return this.parseTupleDestructuring();
        }

        // Check for typed variable declaration (series float x = ...)
        // Also handles: type[] name = ... and type<generic> name = ...
        // Also handles comma-separated typed declarations: float num = 1.0, float den = 1.0
        if (this.peek().type === TokenType.IDENTIFIER && this.isTypedVarDeclaration()) {
            const firstDecl = this.parseTypedVarDeclaration();

            // Check for comma-separated typed declarations on the same line
            if (this.match(TokenType.COMMA) && this.peek(1).type === TokenType.IDENTIFIER) {
                const declarations: any[] = [firstDecl];
                while (this.match(TokenType.COMMA)) {
                    this.advance(); // consume comma
                    this.skipNewlines(true);
                    if (this.peek().type === TokenType.IDENTIFIER && this.isTypedVarDeclaration()) {
                        declarations.push(this.parseTypedVarDeclaration());
                    } else {
                        // Not a typed declaration after comma — parse as a regular statement
                        this.rejectReservedAssignmentTarget();
                        const startToken = this.peek();
                        const expr = this.parseExpression();
                        if (this.match(TokenType.OPERATOR)) {
                            const op = this.peek().value;
                            if (['=', ':='].includes(op)) {
                                this.advance();
                                this.skipNewlines(true);
                                const right = this.parseExpression();
                                if (op === '=' && expr.type === 'Identifier') {
                                    this.assertDeclarableName(expr, startToken);
                                    this.assertNotTupleAssignment(expr, right, startToken);
                                    declarations.push(new VariableDeclaration([new VariableDeclarator(expr, right)], VariableDeclarationKind.LET));
                                } else {
                                    declarations.push(new ExpressionStatement(new AssignmentExpression(op === ':=' ? '=' : op, expr, right)));
                                }
                            }
                        }
                        break;
                    }
                }
                return declarations; // Return array of statements
            }

            return firstDecl;
        }

        // Try to parse as sequence (assignment, assignment, ..., expression)
        // This handles: mean = ta.sma(...), sd = ta.stdev(...), (source - mean) / sd
        const sequenceItems = [];

        while (true) {
            // Parse one item (could be assignment or expression)
            this.rejectReservedAssignmentTarget();
            const startToken = this.peek();
            const expr = this.parseExpression();

            // Check if it's an assignment
            if (this.match(TokenType.OPERATOR)) {
                const op = this.peek().value;
                if (['=', ':=', '+=', '-=', '*=', '/=', '%='].includes(op)) {
                    this.advance();
                    this.skipNewlines(true);
                    const right = this.parseExpression();

                    // Simple assignment with = creates variable declaration
                    if (op === '=' && expr.type === 'Identifier') {
                        this.assertDeclarableName(expr, startToken);
                        this.assertNotTupleAssignment(expr, right, startToken);
                        sequenceItems.push(new VariableDeclaration([new VariableDeclarator(expr, right)], VariableDeclarationKind.LET));
                    } else {
                        sequenceItems.push(new ExpressionStatement(new AssignmentExpression(op === ':=' ? '=' : op, expr, right)));
                    }

                    // Check for comma (sequence continuation)
                    if (this.match(TokenType.COMMA)) {
                        this.advance();
                        this.skipNewlines();
                        continue; // Parse next item in sequence
                    }

                    break; // No comma, done with sequence
                } else {
                    // Not an assignment, just return expression
                    if (sequenceItems.length > 0) {
                        // We have sequence items already, add this as final expression
                        sequenceItems.push(new ExpressionStatement(expr));
                    } else {
                        // Just a single expression
                        return new ExpressionStatement(expr);
                    }
                    break;
                }
            } else {
                // No operator, check for comma
                if (this.match(TokenType.COMMA)) {
                    // Expression followed by comma - add to sequence
                    sequenceItems.push(new ExpressionStatement(expr));
                    this.advance();
                    this.skipNewlines();
                    continue;
                } else {
                    // Just a single expression
                    if (sequenceItems.length > 0) {
                        sequenceItems.push(new ExpressionStatement(expr));
                    } else {
                        return new ExpressionStatement(expr);
                    }
                    break;
                }
            }
        }

        // If we collected multiple items, return array
        if (sequenceItems.length > 1) {
            return sequenceItems; // Return array of statements
        } else if (sequenceItems.length === 1) {
            return sequenceItems[0];
        }

        return null;
    }

    // Parse if statement
    parseIfStatement() {
        this.expect(TokenType.KEYWORD, 'if');
        const test = this.parseExpression();
        this.skipNewlines();

        const consequent = this.parseBlock();
        let alternate = null;

        // An 'else' may follow the block after blank or comment-only lines.
        this.skipNewlines();

        if (this.match(TokenType.KEYWORD, 'else')) {
            this.advance();
            this.skipNewlines();

            if (this.match(TokenType.KEYWORD, 'if')) {
                alternate = this.parseIfStatement();
            } else {
                alternate = this.parseBlock();
            }
        }

        return new IfStatement(test, consequent, alternate);
    }

    // Parse for statement (both range-based and for-in)
    parseForStatement() {
        this.expect(TokenType.KEYWORD, 'for');

        // Check if loop variable is a destructuring pattern or simple identifier
        let loopVar = null;
        let isDestructuring = false;

        if (this.match(TokenType.LBRACKET)) {
            // Destructuring pattern: for [a, b] in array
            this.advance(); // consume [
            const elements = [];
            while (!this.match(TokenType.RBRACKET)) {
                this.skipNewlines();
                elements.push(new Identifier(this.expect(TokenType.IDENTIFIER).value));
                if (this.match(TokenType.COMMA)) {
                    this.advance();
                }
            }
            this.expect(TokenType.RBRACKET);
            loopVar = new ArrayPattern(elements);
            isDestructuring = true;
        } else {
            // Simple identifier: for i in array or for i = 0 to 10
            const varName = this.expectName().value;
            loopVar = new Identifier(varName);
        }

        // Check if it's for-in loop (for item in array) or range loop (for i = 0 to 10)
        if (this.match(TokenType.KEYWORD, 'in')) {
            // for-in loop: for p in pivots or for [a, b] in array
            this.advance(); // consume 'in'
            const iterable = this.parseExpression();
            this.skipNewlines();
            const body = this.parseBlock();

            // Convert to: for (const p of iterable) { body }
            // Using ForStatement with null test to represent for-in
            const init = new VariableDeclaration([new VariableDeclarator(loopVar, iterable)], VariableDeclarationKind.CONST);

            // Mark this as a for-in loop by setting special properties
            const forStmt = new ForStatement(init, null, null, body);
            forStmt.isForIn = true; // Custom flag to indicate for-in
            return forStmt;
        } else {
            // Range-based for loop: for i = 0 to 10
            // Note: range-based loops don't support destructuring
            if (isDestructuring) {
                throw new Error(`Range-based for loops don't support destructuring at ${this.peek().line}:${this.peek().column}`);
            }

            this.expect(TokenType.OPERATOR, '=');
            const start = this.parseExpression();
            this.expect(TokenType.KEYWORD, 'to');
            const end = this.parseExpression();

            let step = null;
            if (this.match(TokenType.KEYWORD, 'by')) {
                this.advance();
                step = this.parseExpression();
            }

            this.skipNewlines();
            const body = this.parseBlock();

            // Build for loop with runtime direction detection.
            // Pine Script: `for i = start to end [by step]`
            // Direction is determined at runtime (start <= end → increment, else decrement).
            // Generated: for (let i = start; start <= end ? i <= end : i >= end; start <= end ? i++ : i--)
            const init = new VariableDeclaration([new VariableDeclarator(loopVar, start)], VariableDeclarationKind.LET);

            const directionCheck = new BinaryExpression('<=', start, end);
            const test = new ConditionalExpression(
                directionCheck,
                new BinaryExpression('<=', loopVar, end),
                new BinaryExpression('>=', loopVar, end)
            );

            let update;
            if (step) {
                // with step: start <= end ? i += step : i -= step
                update = new ConditionalExpression(
                    directionCheck,
                    new AssignmentExpression('+=', loopVar, step),
                    new AssignmentExpression('-=', loopVar, step)
                );
            } else {
                // no step: start <= end ? i++ : i--
                update = new ConditionalExpression(
                    directionCheck,
                    new UpdateExpression('++', loopVar),
                    new UpdateExpression('--', loopVar)
                );
            }

            return new ForStatement(init, test, update, body);
        }
    }

    // Parse while statement
    parseWhileStatement() {
        this.expect(TokenType.KEYWORD, 'while');
        const test = this.parseExpression();
        this.skipNewlines();
        const body = this.parseBlock();

        return new WhileStatement(test, body);
    }

    // Parse indented block
    parseBlock() {
        if (!this.match(TokenType.INDENT)) {
            // `if cond` followed by a body line at 2 or 6 columns: the lexer
            // joined that line onto the header (not a multiple of four), so
            // there is no INDENT. TradingView rejects it as a syntax error.
            this.rejectDanglingWrappedLine();
            // Single statement without indent (shouldn't happen in proper PineScript)
            const stmt = this.parseStatement();
            return new BlockStatement(stmt ? [stmt] : []);
        }

        const blockIndent = this.peek().indent;
        this.advance(); // consume INDENT

        const statements = [];
        while (!this.match(TokenType.EOF)) {
            this.skipNewlines();
            
            // Check for DEDENT
            if (this.match(TokenType.DEDENT)) {
                const dedentLevel = this.peek().indent;
                if (dedentLevel < blockIndent) {
                    // Dedenting out of this block
                    break;
                } else {
                    // Dedenting from a deeper level back to this block (or deeper)
                    // Consume spurious DEDENT
                    this.advance();
                    continue;
                }
            }

            if (this.match(TokenType.EOF)) break;

            const stmt = this.parseStatement();
            if (stmt) statements.push(stmt);
        }

        if (this.match(TokenType.DEDENT)) {
            const dedentLevel = this.peek().indent;
            if (dedentLevel < blockIndent) {
                this.advance();
            }
        }

        return new BlockStatement(statements);
    }

    // Check if current position looks like tuple destructuring.
    // Also matches the shapes TradingView rejects — a type keyword before a name
    // (`[int a, b] = ...`) and `:=` — so parseTupleDestructuring reports them.
    isTupleDestructuring() {
        if (!this.match(TokenType.LBRACKET)) return false;

        let i = 1; // After [

        // Skip identifiers and commas
        while (true) {
            // Skip newlines
            while (this.peek(i).type === TokenType.NEWLINE) i++;

            // Expect identifier
            if (this.peek(i).type !== TokenType.IDENTIFIER) return false;
            i++;
            if (this.peek(i).type === TokenType.IDENTIFIER) i++;

            // Skip newlines
            while (this.peek(i).type === TokenType.NEWLINE) i++;

            // Check for comma (more elements) or ] (end of list)
            if (this.peek(i).type === TokenType.RBRACKET) {
                i++; // Skip ]
                break;
            } else if (this.peek(i).type === TokenType.COMMA) {
                i++; // Skip comma
                continue;
            } else {
                return false; // Unexpected token
            }
        }

        // Skip newlines after ]
        while (this.peek(i).type === TokenType.NEWLINE) i++;

        // Check for = (or := , rejected by parseTupleDestructuring)
        return this.peek(i).type === TokenType.OPERATOR && (this.peek(i).value === '=' || this.peek(i).value === ':=');
    }

    // Parse tuple destructuring
    parseTupleDestructuring() {
        const open = this.expect(TokenType.LBRACKET);
        const elements = [];
        const declared = new Set<string>();

        while (!this.match(TokenType.RBRACKET)) {
            this.skipNewlines();
            // TradingView does not apply the reserved-word check to tuple
            // targets: `[text, b] = f()` compiles. Mirror that.
            const nameToken = this.expect(TokenType.IDENTIFIER);
            if (this.match(TokenType.IDENTIFIER)) {
                // Tuple declarations take no type keywords: `[int a, int b] = f()`.
                throw new Error(`Mismatched input "${this.peek().value}" expecting set "]" at ${this.startOf(this.peek())}`);
            }
            let name = nameToken.value;
            if (name !== '_') {
                if (declared.has(name)) throw new Error(`"${name}" is already defined at ${this.startOf(open)}`);
                declared.add(name);
            }
            if (this.functionNames.has(name)) {
                name = name + '_var';
            }
            elements.push(new Identifier(name));

            if (this.match(TokenType.COMMA)) {
                this.advance();
            }
        }

        this.expect(TokenType.RBRACKET);
        this.skipNewlines();
        if (this.match(TokenType.OPERATOR, ':=')) {
            throw new Error(`Mismatched input ":=" expecting set "=" at ${this.startOf(this.peek())}`);
        }
        this.expect(TokenType.OPERATOR, '=');
        this.skipNewlines(true);
        const init = this.parseExpression();

        this.assertNotTupleLiteral(init);
        const arity = this.tupleArityOf(init);
        if (arity !== undefined && arity !== elements.length) {
            throw new Error(
                `Syntax error: The quantities of tuple elements on each side of the assignment operator do not match. ` +
                    `The right side has ${arity} but the left side has ${elements.length}. at ${this.startOf(open)}`
            );
        }

        return new VariableDeclaration([new VariableDeclarator(new ArrayPattern(elements), init)], VariableDeclarationKind.CONST);
    }

    // Expression parsing (operator precedence)
    parseExpression() {
        return this.parseTernary();
    }

    parseTernary() {
        let expr = this.parseLogicalOr();

        if (this.match(TokenType.OPERATOR, '?')) {
            const question = this.advance();
            this.skipNewlines(true);
            const consequent = this.parseExpression();
            this.expect(TokenType.COLON);
            this.skipNewlines(true);
            const alternate = this.parseExpression();
            // Only local blocks (functions, if/switch, loops) return tuples.
            const tuple = [consequent, alternate].find((branch) => branch.type === 'ArrayExpression');
            if (tuple) {
                throw new Error(
                    'Ternary operations cannot return tuples. Convert the expression into an `if` or `switch` conditional structure ' +
                        `to return a tuple. at ${this.startOf(this.tupleLiteralStart.get(tuple) ?? question)}`
                );
            }
            return new ConditionalExpression(expr, consequent, alternate);
        }

        return expr;
    }

    parseLogicalOr() {
        let left = this.parseLogicalAnd();

        while (this.match(TokenType.KEYWORD, 'or') || this.peekOperatorEx(['||'])) {
            this.advance();
            this.skipNewlines(true);
            const right = this.parseLogicalAnd();
            left = new BinaryExpression('||', left, right);
        }

        return left;
    }

    parseLogicalAnd() {
        let left = this.parseEquality();

        while (this.match(TokenType.KEYWORD, 'and') || this.peekOperatorEx(['&&'])) {
            this.advance();
            this.skipNewlines(true);
            const right = this.parseEquality();
            left = new BinaryExpression('&&', left, right);
        }

        return left;
    }

    parseEquality() {
        let left = this.parseComparison();

        while (this.peekOperatorEx(['==', '!='])) {
            const op = this.advance().value;
            this.skipNewlines(true);
            const right = this.parseComparison();
            left = new BinaryExpression(op, left, right);
        }

        return left;
    }

    parseComparison() {
        let left = this.parseAdditive();

        while (this.peekOperatorEx(['<', '>', '<=', '>='])) {
            const op = this.advance().value;
            this.skipNewlines(true);
            const right = this.parseAdditive();
            left = new BinaryExpression(op, left, right);
        }

        return left;
    }

    parseAdditive() {
        let left = this.parseMultiplicative();

        while (this.peekOperatorEx(['+', '-'])) {
            const op = this.advance().value;
            this.skipNewlines(true);
            const right = this.parseMultiplicative();
            left = new BinaryExpression(op, left, right);
        }

        return left;
    }

    parseMultiplicative() {
        let left = this.parseUnary();

        while (this.peekOperatorEx(['*', '/', '%'])) {
            const op = this.advance().value;
            this.skipNewlines(true);
            const right = this.parseUnary();
            left = new BinaryExpression(op, left, right);
        }

        return left;
    }

    parseUnary() {
        if (this.match(TokenType.OPERATOR)) {
            const op = this.peek().value;
            if (['+', '-', '!'].includes(op)) {
                this.advance();
                this.skipNewlines();
                return new UnaryExpression(op, this.parseUnary());
            }
        }

        if (this.match(TokenType.KEYWORD, 'not')) {
            this.advance();
            this.skipNewlines();
            return new UnaryExpression('!', this.parseUnary());
        }

        return this.parsePostfix();
    }

    parsePostfix() {
        let expr = this.parsePrimary();

        while (true) {
            // Don't skip newlines at the start of the loop - newlines terminate expressions in PineScript
            // We'll skip them in specific contexts where they're allowed (like after `.`)

            // Generic type parameters followed by call: array.new<float>(...)
            // Capture the generic type and, for known types, rewrite
            // array.new<float> → array.new_float (same for matrix, etc.)
            if (this.match(TokenType.OPERATOR, '<')) {
                // Save position in case this isn't a generic
                const saved = this.pos;

                // Try to parse as generic type, capturing type name
                this.advance(); // consume <
                let depth = 1;
                let isGeneric = true;
                let genericType = '';

                // Known Pine types that have dedicated new_TYPE methods
                const KNOWN_GENERIC_TYPES = new Set([
                    'float', 'int', 'string', 'bool', 'color',
                    'line', 'label', 'box', 'linefill', 'table',
                ]);

                // Skip until matching >, capturing type identifiers
                while (depth > 0 && !this.match(TokenType.EOF)) {
                    if (this.match(TokenType.OPERATOR, '<')) {
                        depth++;
                        this.advance();
                    } else if (this.match(TokenType.OPERATOR, '>')) {
                        depth--;
                        this.advance();
                    } else if (this.match(TokenType.IDENTIFIER) || this.match(TokenType.COMMA) || this.match(TokenType.DOT)) {
                        // Capture only top-level, simple type names (depth === 1)
                        if (depth === 1 && this.match(TokenType.IDENTIFIER) && genericType === '') {
                            genericType = this.peek().value;
                        }
                        this.advance();
                    } else {
                        // Not a generic type, restore position
                        isGeneric = false;
                        this.pos = saved;
                        break;
                    }
                }

                // For known types, rewrite callee: array.new<float> → array.new_float
                // Only for array/matrix (not map, which uses map.new<K,V> with two type params)
                if (isGeneric && expr.type === 'MemberExpression'
                    && expr.property.name === 'new'
                    && (expr.object.name === 'array' || expr.object.name === 'matrix')
                    && KNOWN_GENERIC_TYPES.has(genericType)) {
                    expr.property = new Identifier('new_' + genericType);
                }

                // If we successfully parsed generic and next is (, parse call
                if (isGeneric && this.match(TokenType.LPAREN)) {
                    expr = this.parseCallExpression(expr);
                    continue;
                } else if (!isGeneric) {
                    // Not a generic, break and let comparison operator handle it
                    break;
                } else {
                    // Generic but no call - just continue
                    continue;
                }
            }
            // Call expression
            else if (this.match(TokenType.LPAREN)) {
                expr = this.parseCallExpression(expr);
            }
            // Member access
            else if (this.match(TokenType.DOT)) {
                this.advance();
                this.skipNewlines(); // Allow method chaining across lines
                // Accept both IDENTIFIER and KEYWORD after DOT — keywords like
                // 'type' can be valid property names (e.g., syminfo.type)
                const propToken = this.peek();
                if (propToken.type !== TokenType.IDENTIFIER && propToken.type !== TokenType.KEYWORD) {
                    throw new Error(`Expected property name but got ${propToken.type} at ${propToken.line}:${propToken.column}`);
                }
                this.advance();
                expr = new MemberExpression(expr, new Identifier(propToken.value), false);
            }
            // Index/history operator
            else if (this.match(TokenType.LBRACKET)) {
                // A `[` that opens a new line is a new statement (`[a, b] = f()`
                // or a tuple `[a, b]` returned after a switch/if expression), not
                // an index on the previous expression. A block expression's
                // closing DEDENT swallows the NEWLINE that would otherwise end
                // the expression, so check the line structure directly.
                if (this.startsNewLine()) {
                    break;
                }
                this.advance();
                this.skipNewlines();
                const index = this.parseExpression();
                this.expect(TokenType.RBRACKET);
                expr = new MemberExpression(expr, index, true);
            } else {
                break;
            }
        }

        return expr;
    }

    parseCallExpression(callee) {
        const calleeToken = this.tokens[this.pos - 1];
        this.expect(TokenType.LPAREN);
        const args = [];
        const namedArgs = [];

        // Only request.*() expression and input.*() options arguments accept a tuple.
        const calleeName = this.dottedName(callee);
        const acceptsTuple = calleeName !== null && (calleeName === 'input' || /^(request|input)\./.test(calleeName));
        const rejectTupleArg = (value: any, token: Token, paramName: string | undefined) => {
            if (value.type !== 'ArrayExpression' || acceptsTuple) return;
            if (paramName !== undefined) {
                throw new Error(
                    `The "${paramName}" parameter of the "${calleeName}()" function cannot accept a tuple as an argument. ` +
                        `Pass a single argument to this parameter. at ${this.startOf(calleeToken)}`
                );
            }
            throw new Error(
                `Cannot call "${calleeName ?? 'function'}" with a tuple argument. Only the expression parameter of request.*() ` +
                    `functions and the options parameter of input.*() functions accept tuples. at ${this.startOf(token)}`
            );
        };
        const userParams = calleeName !== null ? this.functionParamNames.get(calleeName) : undefined;

        while (!this.match(TokenType.RPAREN)) {
            this.skipNewlines();
            if (this.match(TokenType.RPAREN)) break;
            const argToken = this.peek();

            // Check for named argument (name = value)
            // Note: 'name' can be an IDENTIFIER or KEYWORD (like 'type')
            if (
                (this.peek().type === TokenType.IDENTIFIER || this.peek().type === TokenType.KEYWORD) &&
                this.peek(1).type === TokenType.OPERATOR &&
                this.peek(1).value === '='
            ) {
                const name = this.advance().value;
                this.advance(); // =
                this.skipNewlines();
                const valueToken = this.peek();
                const value = this.parseExpression();
                rejectTupleArg(value, valueToken, userParams ? name : undefined);
                namedArgs.push(new Property(new Identifier(name), value));
            } else {
                const value = this.parseExpression();
                rejectTupleArg(value, argToken, userParams?.[args.length]);
                args.push(value);
            }

            if (this.match(TokenType.COMMA)) {
                this.advance();
            }
            this.skipNewlines();
        }

        this.expect(TokenType.RPAREN);

        // If there are named arguments, add them as last argument (object literal)
        if (namedArgs.length > 0) {
            args.push(new ObjectExpression(namedArgs));
        }

        return new CallExpression(callee, args);
    }

    parsePrimary() {
        const token = this.peek();

        // Literals
        if (this.match(TokenType.NUMBER)) {
            const num = this.advance();
            return new Literal(num.value, num.raw);
        }

        if (this.match(TokenType.STRING)) {
            const str = this.advance();
            return new Literal(str.value);
        }

        if (this.match(TokenType.BOOLEAN)) {
            const bool = this.advance();
            return new Literal(bool.value);
        }

        // Identifier. Contextual keywords (`type`, `method`, `enum`) used as
        // values — `switch method`, `type + 1` — already arrive as IDENTIFIER
        // tokens: the lexer only keeps them as keywords in declaration position.
        if (this.match(TokenType.IDENTIFIER)) {
            const id = this.advance();
            let name = id.value;
            if (
                this.functionNames.has(name) &&
                this.peek().type !== TokenType.LPAREN &&
                !this.isCurrentFunctionParam(name) &&
                // `position.top_right` after a user function `position(x) => ...`
                // is the constants namespace, not a variable sharing the
                // function's name — leave the base identifier untouched so the
                // codegen collision pass can treat it as a namespace access.
                !(this.peek().type === TokenType.DOT && NAMESPACE_COLLISION_NAMES.has(name))
            ) {
                name = name + '_var';
            }
            const node = new Identifier(name);
            (node as any)._pos = this.startOf(id);
            return node;
        }

        // Array literal
        if (this.match(TokenType.LBRACKET)) {
            return this.parseArrayLiteral();
        }

        // Parenthesized expression
        if (this.match(TokenType.LPAREN)) {
            this.advance();
            this.skipNewlines();
            const expr = this.parseExpression();
            this.skipNewlines();
            this.expect(TokenType.RPAREN);
            return expr;
        }

        // If expression
        if (this.match(TokenType.KEYWORD, 'if')) {
            return this.parseIfExpression();
        }

        // Switch expression
        if (this.match(TokenType.KEYWORD, 'switch')) {
            return this.parseSwitchExpression();
        }

        // For expression (for loop as expression — returns last evaluated value)
        if (this.match(TokenType.KEYWORD, 'for')) {
            return this.parseForExpression();
        }

        // While expression (while loop as expression — returns last evaluated value)
        if (this.match(TokenType.KEYWORD, 'while')) {
            return this.parseWhileExpression();
        }

        throw this.unexpected(token);
    }

    parseArrayLiteral() {
        const open = this.expect(TokenType.LBRACKET);
        const elements = [];

        while (!this.match(TokenType.RBRACKET)) {
            this.skipNewlines();
            if (this.match(TokenType.RBRACKET)) break;

            elements.push(this.parseExpression());

            if (this.match(TokenType.COMMA)) {
                this.advance();
            }
            this.skipNewlines();
        }

        this.expect(TokenType.RBRACKET);
        const tuple = new ArrayExpression(elements);
        this.tupleLiteralStart.set(tuple, open);
        return tuple;
    }

    parseIfExpression() {
        this.expect(TokenType.KEYWORD, 'if');
        const test = this.parseExpression();
        this.skipNewlines();

        this.expect(TokenType.INDENT);
        const consequentStmts = [];
        while (!this.match(TokenType.DEDENT) && !this.match(TokenType.EOF)) {
            this.skipNewlines();
            if (this.match(TokenType.DEDENT)) break;
            const stmt = this.parseStatement();
            if (stmt) consequentStmts.push(stmt);
        }
        this.advance(); // DEDENT

        let alternateStmts = [];
        if (this.match(TokenType.KEYWORD, 'else')) {
            this.advance();
            this.skipNewlines();

            if (this.match(TokenType.KEYWORD, 'if')) {
                // Recursive if expression
                const nestedIf = this.parseIfExpression();

                // Check if we need IIFE (has multiple statements or control flow)
                const needsIIFE = this.needsIIFE(consequentStmts, alternateStmts);

                if (needsIIFE) {
                    // Return a marked conditional that needs IIFE
                    const condExpr = new ConditionalExpression(test, new BlockStatement(consequentStmts), nestedIf);
                    condExpr.needsIIFE = true;
                    condExpr.consequentStmts = consequentStmts;
                    condExpr.alternateExpr = nestedIf;
                    return condExpr;
                } else {
                    return new ConditionalExpression(test, this.getBlockValue(consequentStmts), nestedIf);
                }
            } else {
                this.expect(TokenType.INDENT);
                while (!this.match(TokenType.DEDENT) && !this.match(TokenType.EOF)) {
                    this.skipNewlines();
                    if (this.match(TokenType.DEDENT)) break;
                    const stmt = this.parseStatement();
                    if (stmt) alternateStmts.push(stmt);
                }
                this.advance(); // DEDENT
            }
        }

        // Check if we need IIFE (has multiple statements or control flow)
        const needsIIFE = this.needsIIFE(consequentStmts, alternateStmts);

        if (needsIIFE) {
            // Return a marked conditional that needs IIFE
            const condExpr = new ConditionalExpression(test, new BlockStatement(consequentStmts), new BlockStatement(alternateStmts));
            condExpr.needsIIFE = true;
            condExpr.consequentStmts = consequentStmts;
            condExpr.alternateStmts = alternateStmts;
            return condExpr;
        }

        // Simple case: convert to ternary
        const consequent = this.getBlockValue(consequentStmts);
        const alternate = alternateStmts.length > 0 ? this.getBlockValue(alternateStmts) : new Literal(null);
        return new ConditionalExpression(test, consequent, alternate);
    }

    // Check if if-expression needs IIFE (multi-statement or has control flow)
    needsIIFE(consequentStmts, alternateStmts) {
        // If either branch has multiple statements, need IIFE
        if (consequentStmts.length > 1 || alternateStmts.length > 1) {
            return true;
        }

        // If either branch has a control flow statement (if, for, while), need IIFE
        const hasControlFlow = (stmts) => {
            return stmts.some(
                (stmt) =>
                    stmt.type === 'IfStatement' || stmt.type === 'ForStatement' || stmt.type === 'WhileStatement' || stmt.type === 'BlockStatement'
            );
        };

        return hasControlFlow(consequentStmts) || hasControlFlow(alternateStmts);
    }

    parseSwitchExpression() {
        this.expect(TokenType.KEYWORD, 'switch');
        
        // Check if switch has no discriminant (switch without expression)
        // In this case, the next token will be NEWLINE or INDENT
        let discriminant = null;
        if (!this.match(TokenType.NEWLINE) && !this.match(TokenType.INDENT)) {
            discriminant = this.parseExpression();
        }
        
        this.skipNewlines();
        this.expect(TokenType.INDENT);

        const cases = [];
        while (!this.match(TokenType.DEDENT) && !this.match(TokenType.EOF)) {
            this.skipNewlines();
            if (this.match(TokenType.DEDENT)) break;

            let test = null;
            if (!this.match(TokenType.OPERATOR, '=>')) {
                test = this.parseExpression();
            }

            this.expect(TokenType.OPERATOR, '=>');
            this.skipNewlines();

            const consequentStmts = [];
            if (this.match(TokenType.INDENT)) {
                this.advance();
                while (!this.match(TokenType.DEDENT) && !this.match(TokenType.EOF)) {
                    this.skipNewlines();
                    if (this.match(TokenType.DEDENT)) break;
                    const stmt = this.parseStatement();
                    if (stmt) consequentStmts.push(stmt);
                }
                this.advance(); // DEDENT
            } else {
                // Single line: may be an expression or a statement (e.g., col := value)
                const stmt = this.parseStatement();
                if (stmt) consequentStmts.push(stmt);
            }

            // Extract the value expression from statements (for backwards compatibility)
            const consequent = this.getBlockValue(consequentStmts);
            // Pass both the final value AND all statements to SwitchCase
            cases.push(new SwitchCase(test, consequent, consequentStmts));
            this.skipNewlines();
        }

        this.advance(); // DEDENT
        return new SwitchExpression(discriminant, cases);
    }

    // Parse for loop used as expression (returns last evaluated value)
    // Example: _result = for i = 0 to 4 \n close[i]
    parseForExpression() {
        const forStmt = this.parseForStatement();
        // Mark as expression-returning
        (forStmt as any).isExpression = true;
        return forStmt;
    }

    // Parse while loop used as expression (returns last evaluated value)
    // Example: _result = while condition \n expr
    parseWhileExpression() {
        const whileStmt = this.parseWhileStatement();
        // Mark as expression-returning
        (whileStmt as any).isExpression = true;
        return whileStmt;
    }

    getBlockValue(statements) {
        if (statements.length === 0) {
            return new Literal(null);
        }

        const last = statements[statements.length - 1];
        if (last.type === 'ExpressionStatement') {
            return last.expression;
        }
        if (last.type === 'VariableDeclaration' && last.declarations.length > 0) {
            return last.declarations[0].id;
        }

        return new Literal(null);
    }
}