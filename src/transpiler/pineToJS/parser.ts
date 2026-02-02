// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

// PineScript Parser with Proper Indentation Support
// Uses INDENT/DEDENT tokens from lexer

import { Token, TokenType } from './tokens';
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

export class Parser {
    private tokens: Token[];
    private pos: number;
    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.pos = 0;
    }

    // Utility methods
    peek(offset = 0) {
        return this.tokens[this.pos + offset] || this.tokens[this.tokens.length - 1];
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
            throw new Error(`Expected ${type} but got ${token.type} at ${token.line}:${token.column}`);
        }
        if (value !== null && token.value !== value) {
            throw new Error(`Expected '${value}' but got '${token.value}' at ${token.line}:${token.column}`);
        }
        return this.advance();
    }

    // Match a token, optionally ignoring NEWLINE and INDENT (for line continuation)
    matchEx(type, value = null, allowLineContinuation = false) {
        if (!allowLineContinuation) {
            return this.match(type, value);
        }

        let offset = 0;
        let token = this.peek(offset);

        // Skip NEWLINE and subsequent INDENT
        if (token.type === TokenType.NEWLINE) {
            offset++;
            token = this.peek(offset);
            
            // Optional INDENT after NEWLINE
            if (token.type === TokenType.INDENT) {
                offset++;
                token = this.peek(offset);
            }
        }

        if (token.type !== type) return false;
        if (value !== null && token.value !== value) return false;

        // Consume skipped tokens
        for (let i = 0; i < offset; i++) {
            this.advance();
        }
        
        return true;
    }

    skipNewlines(allowIndent = false) {
        while (this.match(TokenType.NEWLINE)) {
            this.advance();
        }
        if (allowIndent && this.match(TokenType.INDENT)) {
            this.advance();
        }
    }

    // Main parse method
    parse() {
        const body = [];

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

    // Parse statement
    parseStatement() {
        this.skipNewlines();

        const startLine = this.peek().line;

        // Skip comments
        if (this.match(TokenType.COMMENT)) {
            this.advance();
            return null;
        }

        let stmt;

        // Type definition
        if (this.match(TokenType.KEYWORD, 'type')) {
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
        else if (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.IDENTIFIER) {
            // Check if this is a typed variable declaration
            let offset = 2;
            // Skip additional type qualifiers (series float x, simple int y, etc.)
            while (this.peek(offset).type === TokenType.IDENTIFIER) {
                offset++;
            }
            if (this.peek(offset).type === TokenType.OPERATOR && this.peek(offset).value === '=') {
                stmt = this.parseTypedVarDeclaration();
            }
        }

        if (!stmt) {
            // Expression or assignment
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
        }

        return stmt;
    }

    // Check if current position is function declaration
    isFunctionDeclaration() {
        const saved = this.pos;
        try {
            // Pattern: [type] identifier(...) =>
            let i = 0;

            // Optional return type
            if (this.peek(i).type === TokenType.IDENTIFIER && this.peek(i + 1).type === TokenType.IDENTIFIER) {
                i++; // Skip return type
            }

            // Function name
            if (this.peek(i).type !== TokenType.IDENTIFIER) {
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

            // Skip newlines
            while (this.peek(i).type === TokenType.NEWLINE) i++;

            // Check for =>
            return this.peek(i).type === TokenType.OPERATOR && this.peek(i).value === '=>';
        } finally {
            this.pos = saved;
        }
    }

    // Parse type definition (v5: type X => fields, v6: type X\n fields)
    parseTypeDefinition() {
        this.expect(TokenType.KEYWORD, 'type');
        const name = this.expect(TokenType.IDENTIFIER).value;

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
            const fieldType = this.expect(TokenType.IDENTIFIER).value;
            const fieldName = this.expect(TokenType.IDENTIFIER).value;

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
            name = this.expect(TokenType.IDENTIFIER).value;
        } else if (
            this.peek().type === TokenType.IDENTIFIER &&
            (this.peek(1).type === TokenType.IDENTIFIER || (this.peek(1).type === TokenType.OPERATOR && this.peek(1).value === '<'))
        ) {
            // Has type: var type name = ... or var type<generic> name = ...
            varType = this.advance().value;

            // Handle generic type syntax: array<float>, map<string, int>, etc.
            if (this.match(TokenType.OPERATOR, '<')) {
                this.advance(); // consume <
                varType += '<';

                // Read generic type parameter(s)
                while (!this.match(TokenType.OPERATOR, '>')) {
                    if (this.match(TokenType.IDENTIFIER)) {
                        varType += this.advance().value;
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

            name = this.expect(TokenType.IDENTIFIER).value;
        } else if (this.peek().type === TokenType.IDENTIFIER) {
            // No type: var name = ...
            name = this.advance().value;
        } else {
            throw new Error(`Expected identifier after ${kind} at ${this.peek().line}:${this.peek().column}`);
        }

        this.expect(TokenType.OPERATOR, '=');
        this.skipNewlines(true);
        const init = this.parseExpression();

        const id = new Identifier(name);
        if (varType) {
            id.varType = varType;
        }

        return new VariableDeclaration([new VariableDeclarator(id, init, varType)], kind);
    }

    // Parse typed variable declaration (int x = ... or series float x = ...)
    parseTypedVarDeclaration() {
        let varType = this.advance().value;

        // Handle multi-qualifier types (series float, simple int, etc.)
        while (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.IDENTIFIER) {
            varType += ' ' + this.advance().value;
        }

        const name = this.expect(TokenType.IDENTIFIER).value;
        this.expect(TokenType.OPERATOR, '=');
        this.skipNewlines(true);
        const init = this.parseExpression();

        const id = new Identifier(name);
        id.varType = varType;

        return new VariableDeclaration([new VariableDeclarator(id, init, varType)], VariableDeclarationKind.LET);
    }

    // Parse function declaration
    parseFunctionDeclaration() {
        let returnType = null;
        if (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.IDENTIFIER) {
            returnType = this.advance().value;
        }

        const name = this.expect(TokenType.IDENTIFIER).value;
        this.expect(TokenType.LPAREN);

        const params = [];
        while (!this.match(TokenType.RPAREN)) {
            this.skipNewlines();
            if (this.match(TokenType.RPAREN)) break;

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

            const paramName = this.expect(TokenType.IDENTIFIER).value;
            const param = new Identifier(paramName);
            if (paramType) param.varType = paramType;

            // Handle default parameters
            if (this.match(TokenType.OPERATOR, '=')) {
                this.advance();
                this.skipNewlines();
                const defaultValue = this.parseExpression();
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

        const body = this.parseFunctionBody();
        const id = new Identifier(name);
        if (returnType) id.returnType = returnType;

        return new FunctionDeclaration(id, params, body, returnType);
    }

    // Parse method declaration (method name(Type this, params) => ...)
    parseMethodDeclaration() {
        this.expect(TokenType.KEYWORD, 'method');

        let returnType = null;
        if (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.IDENTIFIER && this.peek(2).type === TokenType.LPAREN) {
            returnType = this.advance().value;
        }

        const name = this.expect(TokenType.IDENTIFIER).value;
        this.expect(TokenType.LPAREN);

        const params = [];
        while (!this.match(TokenType.RPAREN)) {
            this.skipNewlines();
            if (this.match(TokenType.RPAREN)) break;

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

            const paramName = this.expect(TokenType.IDENTIFIER).value;
            const param = new Identifier(paramName);
            if (paramType) param.varType = paramType;

            // Handle default parameters
            if (this.match(TokenType.OPERATOR, '=')) {
                this.advance();
                this.skipNewlines();
                const defaultValue = this.parseExpression();
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

        const body = this.parseFunctionBody();
        const id = new Identifier(name);
        if (returnType) id.returnType = returnType;
        id.isMethod = true; // Mark as method

        return new FunctionDeclaration(id, params, body, returnType);
    }

    // Parse function body (handles both single expression and block)
    parseFunctionBody() {
        const statements = [];

        // Check if it's a single expression (no INDENT)
        if (!this.match(TokenType.INDENT)) {
            const expr = this.parseExpression();
            return new BlockStatement([new ReturnStatement(expr)]);
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

        // Make last statement a return if it's an expression
        if (statements.length > 0) {
            const last = statements[statements.length - 1];
            if (last.type === 'ExpressionStatement') {
                statements[statements.length - 1] = new ReturnStatement(last.expression);
            }
        }

        return new BlockStatement(statements);
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
        if (this.peek().type === TokenType.IDENTIFIER && this.peek(1).type === TokenType.IDENTIFIER) {
            let offset = 2;
            while (this.peek(offset).type === TokenType.IDENTIFIER) {
                offset++;
            }
            if (this.peek(offset).type === TokenType.OPERATOR && this.peek(offset).value === '=') {
                return this.parseTypedVarDeclaration();
            }
        }

        // Try to parse as sequence (assignment, assignment, ..., expression)
        // This handles: mean = ta.sma(...), sd = ta.stdev(...), (source - mean) / sd
        const sequenceItems = [];

        while (true) {
            // Parse one item (could be assignment or expression)
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
            const varName = this.expect(TokenType.IDENTIFIER).value;
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

            // Build for loop: for (let i = start; i <= end; i++)
            const init = new VariableDeclaration([new VariableDeclarator(loopVar, start)], VariableDeclarationKind.LET);

            const test = new BinaryExpression('<=', loopVar, end);

            const update = step ? new AssignmentExpression('+=', loopVar, step) : new UpdateExpression('++', loopVar);

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

    // Check if current position looks like tuple destructuring
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

        // Check for =
        return this.peek(i).type === TokenType.OPERATOR && this.peek(i).value === '=';
    }

    // Parse tuple destructuring
    parseTupleDestructuring() {
        this.expect(TokenType.LBRACKET);
        const elements = [];

        while (!this.match(TokenType.RBRACKET)) {
            this.skipNewlines();
            elements.push(new Identifier(this.expect(TokenType.IDENTIFIER).value));

            if (this.match(TokenType.COMMA)) {
                this.advance();
            }
        }

        this.expect(TokenType.RBRACKET);
        this.skipNewlines();
        this.expect(TokenType.OPERATOR, '=');
        this.skipNewlines(true);
        const init = this.parseExpression();

        return new VariableDeclaration([new VariableDeclarator(new ArrayPattern(elements), init)], VariableDeclarationKind.CONST);
    }

    // Expression parsing (operator precedence)
    parseExpression() {
        return this.parseTernary();
    }

    parseTernary() {
        let expr = this.parseLogicalOr();

        if (this.matchEx(TokenType.OPERATOR, '?', true)) {
            this.advance();
            this.skipNewlines(true);
            const consequent = this.parseExpression();
            
            // Handle : with line continuation
            if (this.matchEx(TokenType.COLON, null, true)) {
                this.advance(); // Consume :
            } else {
                this.expect(TokenType.COLON);
            }
            
            this.skipNewlines(true);
            const alternate = this.parseExpression();
            return new ConditionalExpression(expr, consequent, alternate);
        }

        return expr;
    }

    parseLogicalOr() {
        let left = this.parseLogicalAnd();

        while (this.matchEx(TokenType.KEYWORD, 'or', true) || (this.matchEx(TokenType.OPERATOR, null, true) && this.peek().value === '||')) {
            this.advance();
            this.skipNewlines(true);
            const right = this.parseLogicalAnd();
            left = new BinaryExpression('||', left, right);
        }

        return left;
    }

    parseLogicalAnd() {
        let left = this.parseEquality();

        while (this.matchEx(TokenType.KEYWORD, 'and', true) || (this.matchEx(TokenType.OPERATOR, null, true) && this.peek().value === '&&')) {
            this.advance();
            this.skipNewlines();
            const right = this.parseEquality();
            left = new BinaryExpression('&&', left, right);
        }

        return left;
    }

    parseEquality() {
        let left = this.parseComparison();

        while (this.matchEx(TokenType.OPERATOR, null, true)) {
            const op = this.peek().value;
            if (!['==', '!='].includes(op)) break;

            this.advance();
            this.skipNewlines(true);
            const right = this.parseComparison();
            left = new BinaryExpression(op, left, right);
        }

        return left;
    }

    parseComparison() {
        let left = this.parseAdditive();

        while (this.matchEx(TokenType.OPERATOR, null, true)) {
            const op = this.peek().value;
            if (!['<', '>', '<=', '>='].includes(op)) break;

            this.advance();
            this.skipNewlines();
            const right = this.parseAdditive();
            left = new BinaryExpression(op, left, right);
        }

        return left;
    }

    parseAdditive() {
        let left = this.parseMultiplicative();

        while (this.matchEx(TokenType.OPERATOR, null, true)) {
            const op = this.peek().value;
            if (!['+', '-'].includes(op)) break;

            this.advance();
            this.skipNewlines(true);
            const right = this.parseMultiplicative();
            left = new BinaryExpression(op, left, right);
        }

        return left;
    }

    parseMultiplicative() {
        let left = this.parseUnary();

        while (this.matchEx(TokenType.OPERATOR, null, true)) {
            const op = this.peek().value;
            if (!['*', '/', '%'].includes(op)) break;

            this.advance();
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
            // We need to skip the generic part and parse the call
            if (this.match(TokenType.OPERATOR, '<')) {
                // Save position in case this isn't a generic
                const saved = this.pos;

                // Try to parse as generic type
                this.advance(); // consume <
                let depth = 1;
                let isGeneric = true;

                // Skip until matching >
                while (depth > 0 && !this.match(TokenType.EOF)) {
                    if (this.match(TokenType.OPERATOR, '<')) {
                        depth++;
                        this.advance();
                    } else if (this.match(TokenType.OPERATOR, '>')) {
                        depth--;
                        this.advance();
                    } else if (this.match(TokenType.IDENTIFIER) || this.match(TokenType.COMMA)) {
                        this.advance();
                    } else {
                        // Not a generic type, restore position
                        isGeneric = false;
                        this.pos = saved;
                        break;
                    }
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
                const property = this.expect(TokenType.IDENTIFIER).value;
                expr = new MemberExpression(expr, new Identifier(property), false);
            }
            // Index/history operator
            else if (this.match(TokenType.LBRACKET)) {
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
        this.expect(TokenType.LPAREN);
        const args = [];
        const namedArgs = [];

        while (!this.match(TokenType.RPAREN)) {
            this.skipNewlines();
            if (this.match(TokenType.RPAREN)) break;

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
                const value = this.parseExpression();
                namedArgs.push(new Property(new Identifier(name), value));
            } else {
                args.push(this.parseExpression());
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
            return new Literal(num.value);
        }

        if (this.match(TokenType.STRING)) {
            const str = this.advance();
            return new Literal(str.value);
        }

        if (this.match(TokenType.BOOLEAN)) {
            const bool = this.advance();
            return new Literal(bool.value);
        }

        // Identifier
        if (this.match(TokenType.IDENTIFIER)) {
            const id = this.advance();
            return new Identifier(id.value);
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

        throw new Error(`Unexpected token ${token.type} '${token.value}' at ${token.line}:${token.column}`);
    }

    parseArrayLiteral() {
        this.expect(TokenType.LBRACKET);
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
        return new ArrayExpression(elements);
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
                // Single expression
                consequentStmts.push(new ExpressionStatement(this.parseExpression()));
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
