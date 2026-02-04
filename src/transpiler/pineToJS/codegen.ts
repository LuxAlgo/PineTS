// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

// JavaScript Code Generator for PineScript AST
// Transforms ESTree-compatible AST into JavaScript code

export class CodeGenerator {
    private indent: number;
    private indentStr: string;
    private output: string[];
    private sourceCode: string | null;
    private sourceLines: string[];
    private lastCommentedLine: number;
    private includeSourceComments: boolean;
    constructor(options: { indentStr?: string; sourceCode?: string; includeSourceComments?: boolean } = {}) {
        this.indent = 0;
        this.indentStr = options.indentStr || '  ';
        this.output = [];
        this.sourceCode = options.sourceCode || null;
        this.sourceLines = this.sourceCode ? this.sourceCode.split('\n') : [];
        this.lastCommentedLine = -1;
        this.includeSourceComments = options.includeSourceComments || false; // default false
    }

    generate(ast) {
        this.output = [];
        this.indent = 0;
        this.lastCommentedLine = -1;

        if (ast.type === 'Program') {
            this.generateProgram(ast);
        } else {
            throw new Error(`Expected Program node, got ${ast.type}`);
        }

        return this.output.join('');
    }

    // Write source code comments
    writeSourceComment(startLine, endLine = null) {
        if (!this.sourceLines.length) return;

        const end = endLine || startLine;
        const linesToComment = [];

        for (let i = startLine - 1; i < end && i < this.sourceLines.length; i++) {
            if (i > this.lastCommentedLine) {
                const line = this.sourceLines[i].trim();
                // Skip empty lines and version directives
                if (line && !line.startsWith('//@') && !line.startsWith('//')) {
                    linesToComment.push(this.sourceLines[i]);
                }
            }
        }

        if (linesToComment.length > 0) {
            for (const line of linesToComment) {
                this.write(this.indentStr.repeat(this.indent));
                this.write('/// ');
                this.write(line.trimEnd());
                this.write('\n');
            }
            this.lastCommentedLine = Math.max(this.lastCommentedLine, end - 1);
        }
    }

    // Helper to add indentation
    write(str) {
        this.output.push(str);
    }

    writeLine(str = '') {
        if (str) {
            this.output.push(this.indentStr.repeat(this.indent) + str + '\n');
        } else {
            this.output.push('\n');
        }
    }

    increaseIndent() {
        this.indent++;
    }

    decreaseIndent() {
        this.indent--;
    }

    // Generate Program node
    generateProgram(node) {
        for (let i = 0; i < node.body.length; i++) {
            this.generateStatement(node.body[i]);

            // Add blank line between top-level declarations for readability
            if (i < node.body.length - 1) {
                const current = node.body[i];
                const next = node.body[i + 1];
                if (
                    (current.type === 'FunctionDeclaration' || current.type === 'TypeDefinition') &&
                    (next.type === 'FunctionDeclaration' || next.type === 'TypeDefinition')
                ) {
                    this.writeLine();
                }
            }
        }
    }

    // Generate any statement
    generateStatement(node) {
        // Emit source comment if line information is available and enabled
        if (this.includeSourceComments && node._line && this.sourceLines.length > 0) {
            this.writeSourceComment(node._line);
        }

        switch (node.type) {
            case 'FunctionDeclaration':
                return this.generateFunctionDeclaration(node);
            case 'VariableDeclaration':
                return this.generateVariableDeclaration(node);
            case 'ExpressionStatement':
                return this.generateExpressionStatement(node);
            case 'IfStatement':
                return this.generateIfStatement(node);
            case 'ForStatement':
                return this.generateForStatement(node);
            case 'WhileStatement':
                return this.generateWhileStatement(node);
            case 'ReturnStatement':
                return this.generateReturnStatement(node);
            case 'BlockStatement':
                return this.generateBlockStatement(node);
            case 'TypeDefinition':
                return this.generateTypeDefinition(node);
            default:
                throw new Error(`Unknown statement type: ${node.type}`);
        }
    }

    // Generate TypeDefinition (convert to Type(...) call)
    generateTypeDefinition(node) {
        this.write(this.indentStr.repeat(this.indent));
        this.write(`const ${node.name} = Type({`);

        if (node.fields.length > 0) {
            this.write(' ');
            for (let i = 0; i < node.fields.length; i++) {
                const field = node.fields[i];
                this.write(`${field.name}: '${field.type}'`);
                if (i < node.fields.length - 1) {
                    this.write(', ');
                }
            }
            this.write(' ');
        }

        this.write('});\n');
    }

    // Generate FunctionDeclaration
    generateFunctionDeclaration(node) {
        this.write(this.indentStr.repeat(this.indent));

        // Don't output methods as standalone functions - they'll be attached to objects at runtime
        // Just generate them as regular functions for now, skipping first 'this' param
        const isMethod = node.id.isMethod;

        this.write('function ');
        this.write(node.id.name);
        this.write('(');

        // Parameters (skip first param if it's a method and first param is 'this')
        const params = node.params;
        const startIdx = isMethod && params.length > 0 && params[0].type === 'Identifier' && params[0].name === 'this' ? 1 : 0;

        for (let i = startIdx; i < params.length; i++) {
            const param = params[i];
            if (param.type === 'Identifier') {
                this.write(param.name);
            } else if (param.type === 'AssignmentPattern') {
                // Handle 'this' in AssignmentPattern
                const leftName = param.left.name === 'this' && isMethod ? 'self' : param.left.name;
                this.write(leftName);
                this.write(' = ');
                this.generateExpression(param.right);
            }
            if (i < params.length - 1) {
                this.write(', ');
            }
        }

        this.write(') ');
        this.generateBlockStatement(node.body, false);
        this.write('\n');
    }

    // Generate VariableDeclaration
    generateVariableDeclaration(node) {
        // PineScript var => JavaScript var (persistent state)
        // PineScript varip => JavaScript var (persistent intrabar state)
        // PineScript regular declarations => JavaScript let (re-initialized each bar)
        const kind = node.kind === 'var' || node.kind === 'varip' ? 'var' : 'let';

        for (let i = 0; i < node.declarations.length; i++) {
            const decl = node.declarations[i];

            // Check if init is a complex if expression that needs statement-based generation
            if (decl.init && decl.init.type === 'ConditionalExpression' && decl.init.needsIIFE) {
                // Generate: let varName;\n if (...) { varName = ... } else { varName = ... }
                const varName = decl.id.type === 'Identifier' ? decl.id.name : null;

                if (varName) {
                    // Declare variable without initialization
                    this.write(this.indentStr.repeat(this.indent));
                    this.write(kind);
                    this.write(' ');
                    this.write(varName);
                    this.write(';\n');

                    // Generate if statement that assigns to the variable
                    this.generateIfStatementWithAssignment(decl.init, varName);
                    continue;
                }
            }

            // Normal variable declaration
            this.write(this.indentStr.repeat(this.indent));
            this.write(kind);
            this.write(' ');

            if (decl.id.type === 'Identifier') {
                this.write(decl.id.name);
            } else if (decl.id.type === 'ArrayPattern') {
                // Tuple destructuring
                this.write('[');
                for (let j = 0; j < decl.id.elements.length; j++) {
                    this.write(decl.id.elements[j].name);
                    if (j < decl.id.elements.length - 1) {
                        this.write(', ');
                    }
                }
                this.write(']');
            }

            if (decl.init) {
                this.write(' = ');
                this.generateExpression(decl.init);
            }

            this.write(';\n');
        }
    }

    // Generate ExpressionStatement
    generateExpressionStatement(node) {
        this.write(this.indentStr.repeat(this.indent));
        this.generateExpression(node.expression);
        this.write(';\n');
    }

    // Generate IfStatement
    generateIfStatement(node) {
        this.write(this.indentStr.repeat(this.indent));
        this.write('if (');
        this.generateExpression(node.test);
        this.write(') ');

        this.generateBlockStatement(node.consequent, false);

        if (node.alternate) {
            this.write(' else ');
            if (node.alternate.type === 'IfStatement') {
                // else if - don't add extra braces
                this.generateIfStatement(node.alternate);
            } else {
                this.generateBlockStatement(node.alternate, false);
            }
        } else {
            this.write('\n');
        }
    }

    // Generate if statement that assigns to a variable (for complex if expressions)
    generateIfStatementWithAssignment(condExpr, varName) {
        this.write(this.indentStr.repeat(this.indent));
        this.write('if (');
        this.generateExpression(condExpr.test);
        this.write(') {\n');
        this.indent++;

        // Generate consequent statements with assignments
        if (condExpr.consequentStmts) {
            for (let i = 0; i < condExpr.consequentStmts.length; i++) {
                const stmt = condExpr.consequentStmts[i];
                const isLast = i === condExpr.consequentStmts.length - 1;

                if (isLast) {
                    // Last statement - assign to variable
                    if (stmt.type === 'ExpressionStatement') {
                        this.write(this.indentStr.repeat(this.indent));
                        this.write(varName);
                        this.write(' = ');
                        this.generateExpression(stmt.expression);
                        this.write(';\n');
                    } else if (stmt.type === 'IfStatement') {
                        // Nested if statement - generate as proper if/else with assignments
                        this.generateNestedIfWithAssignments(stmt, varName);
                    } else {
                        this.generateStatement(stmt);
                    }
                } else {
                    this.generateStatement(stmt);
                }
            }
        }

        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write('}');

        // Generate alternate
        if (condExpr.alternateExpr) {
            // Nested if expression
            this.write(' else {\n');
            this.indent++;
            this.write(this.indentStr.repeat(this.indent));
            this.write(varName);
            this.write(' = ');
            this.generateExpression(condExpr.alternateExpr);
            this.write(';\n');
            this.indent--;
            this.write(this.indentStr.repeat(this.indent));
            this.write('}');
        } else if (condExpr.alternateStmts && condExpr.alternateStmts.length > 0) {
            // Alternate block
            this.write(' else {\n');
            this.indent++;
            for (let i = 0; i < condExpr.alternateStmts.length; i++) {
                const stmt = condExpr.alternateStmts[i];
                const isLast = i === condExpr.alternateStmts.length - 1;

                if (isLast) {
                    // Last statement - assign to variable
                    if (stmt.type === 'ExpressionStatement') {
                        this.write(this.indentStr.repeat(this.indent));
                        this.write(varName);
                        this.write(' = ');
                        this.generateExpression(stmt.expression);
                        this.write(';\n');
                    } else if (stmt.type === 'IfStatement') {
                        // Nested if statement - generate as proper if/else with assignments
                        this.generateNestedIfWithAssignments(stmt, varName);
                    } else {
                        this.generateStatement(stmt);
                    }
                } else {
                    this.generateStatement(stmt);
                }
            }
            this.indent--;
            this.write(this.indentStr.repeat(this.indent));
            this.write('}');
        } else {
            // No alternate
            this.write(' else {\n');
            this.indent++;
            this.write(this.indentStr.repeat(this.indent));
            this.write(varName);
            this.write(' = false;\n');
            this.indent--;
            this.write(this.indentStr.repeat(this.indent));
            this.write('}');
        }

        this.write('\n');
    }

    // Helper to generate nested if statement with assignments (no IIFE)
    generateNestedIfWithAssignments(node, varName) {
        this.write(this.indentStr.repeat(this.indent));
        this.write('if (');
        this.generateExpression(node.test);
        this.write(') {\n');
        this.indent++;

        // Generate consequent with assignments
        if (node.consequent.type === 'BlockStatement' && node.consequent.body.length > 0) {
            for (let i = 0; i < node.consequent.body.length; i++) {
                const stmt = node.consequent.body[i];
                const isLast = i === node.consequent.body.length - 1;

                if (isLast) {
                    // Last statement - assign
                    if (stmt.type === 'ExpressionStatement') {
                        this.write(this.indentStr.repeat(this.indent));
                        this.write(varName);
                        this.write(' = ');
                        this.generateExpression(stmt.expression);
                        this.write(';\n');
                    } else if (stmt.type === 'IfStatement') {
                        // Recursively handle nested if
                        this.generateNestedIfWithAssignments(stmt, varName);
                    } else {
                        this.generateStatement(stmt);
                    }
                } else {
                    this.generateStatement(stmt);
                }
            }
        }

        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write('}');

        // Generate alternate
        if (node.alternate) {
            if (node.alternate.type === 'IfStatement') {
                // else if
                this.write(' else ');
                this.write('if (');
                this.generateExpression(node.alternate.test);
                this.write(') {\n');
                this.indent++;

                // Handle consequent
                if (node.alternate.consequent.type === 'BlockStatement' && node.alternate.consequent.body.length > 0) {
                    for (let i = 0; i < node.alternate.consequent.body.length; i++) {
                        const stmt = node.alternate.consequent.body[i];
                        const isLast = i === node.alternate.consequent.body.length - 1;

                        if (isLast) {
                            if (stmt.type === 'ExpressionStatement') {
                                this.write(this.indentStr.repeat(this.indent));
                                this.write(varName);
                                this.write(' = ');
                                this.generateExpression(stmt.expression);
                                this.write(';\n');
                            } else if (stmt.type === 'IfStatement') {
                                this.generateNestedIfWithAssignments(stmt, varName);
                            } else {
                                this.generateStatement(stmt);
                            }
                        } else {
                            this.generateStatement(stmt);
                        }
                    }
                }

                this.indent--;
                this.write(this.indentStr.repeat(this.indent));
                this.write('}');

                // Recursively handle further alternates
                this.generateNestedIfAlternatesWithAssignments(node.alternate.alternate, varName);
            } else if (node.alternate.type === 'BlockStatement' && node.alternate.body.length > 0) {
                // else block
                this.write(' else {\n');
                this.indent++;

                for (let i = 0; i < node.alternate.body.length; i++) {
                    const stmt = node.alternate.body[i];
                    const isLast = i === node.alternate.body.length - 1;

                    if (isLast) {
                        // Last statement - assign
                        if (stmt.type === 'ExpressionStatement') {
                            this.write(this.indentStr.repeat(this.indent));
                            this.write(varName);
                            this.write(' = ');
                            this.generateExpression(stmt.expression);
                            this.write(';\n');
                        } else if (stmt.type === 'IfStatement') {
                            // Recursively handle nested if
                            this.generateNestedIfWithAssignments(stmt, varName);
                        } else {
                            this.generateStatement(stmt);
                        }
                    } else {
                        this.generateStatement(stmt);
                    }
                }

                this.indent--;
                this.write(this.indentStr.repeat(this.indent));
                this.write('}\n');
            } else {
                this.write(' else {\n');
                this.indent++;
                this.write(this.indentStr.repeat(this.indent));
                this.write(varName);
                this.write(' = false;\n');
                this.indent--;
                this.write(this.indentStr.repeat(this.indent));
                this.write('}\n');
            }
        } else {
            this.write('\n');
        }
    }

    // Helper to continue generating else if / else chain with assignments
    generateNestedIfAlternatesWithAssignments(alternate, varName) {
        if (!alternate) {
            return;
        }

        if (alternate.type === 'IfStatement') {
            // Continue else if chain
            this.write(' else ');
            this.write('if (');
            this.generateExpression(alternate.test);
            this.write(') {\n');
            this.indent++;

            // Handle consequent
            if (alternate.consequent.type === 'BlockStatement' && alternate.consequent.body.length > 0) {
                for (let i = 0; i < alternate.consequent.body.length; i++) {
                    const stmt = alternate.consequent.body[i];
                    const isLast = i === alternate.consequent.body.length - 1;

                    if (isLast) {
                        if (stmt.type === 'ExpressionStatement') {
                            this.write(this.indentStr.repeat(this.indent));
                            this.write(varName);
                            this.write(' = ');
                            this.generateExpression(stmt.expression);
                            this.write(';\n');
                        } else if (stmt.type === 'IfStatement') {
                            this.generateNestedIfWithAssignments(stmt, varName);
                        } else {
                            this.generateStatement(stmt);
                        }
                    } else {
                        this.generateStatement(stmt);
                    }
                }
            }

            this.indent--;
            this.write(this.indentStr.repeat(this.indent));
            this.write('}');

            // Continue recursively
            this.generateNestedIfAlternatesWithAssignments(alternate.alternate, varName);
        } else if (alternate.type === 'BlockStatement' && alternate.body.length > 0) {
            // Final else block
            this.write(' else {\n');
            this.indent++;

            for (let i = 0; i < alternate.body.length; i++) {
                const stmt = alternate.body[i];
                const isLast = i === alternate.body.length - 1;

                if (isLast) {
                    if (stmt.type === 'ExpressionStatement') {
                        this.write(this.indentStr.repeat(this.indent));
                        this.write(varName);
                        this.write(' = ');
                        this.generateExpression(stmt.expression);
                        this.write(';\n');
                    } else if (stmt.type === 'IfStatement') {
                        this.generateNestedIfWithAssignments(stmt, varName);
                    } else {
                        this.generateStatement(stmt);
                    }
                } else {
                    this.generateStatement(stmt);
                }
            }

            this.indent--;
            this.write(this.indentStr.repeat(this.indent));
            this.write('}\n');
        } else {
            // No more alternates or empty else
            this.write(' else {\n');
            this.indent++;
            this.write(this.indentStr.repeat(this.indent));
            this.write(varName);
            this.write(' = false;\n');
            this.indent--;
            this.write(this.indentStr.repeat(this.indent));
            this.write('}\n');
        }
    }

    // Generate ForStatement
    generateForStatement(node) {
        this.write(this.indentStr.repeat(this.indent));

        // Check if this is a for-in loop (for item in array)
        if (node.isForIn) {
            // Generate: for (const item of array) { ... } or for (const [a, b] of array) { ... }
            this.write('for (');
            if (node.init && node.init.type === 'VariableDeclaration') {
                const decl = node.init.declarations[0];
                this.write(`${node.init.kind} `);

                // Handle both simple identifier and destructuring pattern
                if (decl.id.type === 'Identifier') {
                    this.write(decl.id.name);
                } else if (decl.id.type === 'ArrayPattern') {
                    // Destructuring: [a, b]
                    this.write('[');
                    for (let i = 0; i < decl.id.elements.length; i++) {
                        this.write(decl.id.elements[i].name);
                        if (i < decl.id.elements.length - 1) {
                            this.write(', ');
                        }
                    }
                    this.write(']');
                }

                this.write(' of ');
                this.generateExpression(decl.init);
            }
            this.write(') ');
            this.generateBlockStatement(node.body, false);
            return;
        }

        // Regular range-based for loop
        this.write('for (');

        // Generate init
        if (node.init) {
            if (node.init.type === 'VariableDeclaration') {
                // Generate variable declaration inline
                const decl = node.init.declarations[0];
                this.write(`${node.init.kind} ${decl.id.name}`);
                if (decl.init) {
                    this.write(' = ');
                    this.generateExpression(decl.init);
                }
            } else {
                this.generateExpression(node.init);
            }
        }

        this.write('; ');

        // Generate test
        if (node.test) {
            this.generateExpression(node.test);
        }

        this.write('; ');

        // Generate update
        if (node.update) {
            if (node.update.type === 'AssignmentExpression') {
                this.generateExpression(node.update.left);
                this.write(` ${node.update.operator} `);
                this.generateExpression(node.update.right);
            } else {
                this.generateExpression(node.update);
            }
        }

        this.write(') ');
        this.generateBlockStatement(node.body, false);
    }

    // Generate WhileStatement
    generateWhileStatement(node) {
        this.write(this.indentStr.repeat(this.indent));
        this.write('while (');
        this.generateExpression(node.test);
        this.write(') ');
        this.generateBlockStatement(node.body, false);
    }

    // Generate ReturnStatement
    generateReturnStatement(node) {
        this.write(this.indentStr.repeat(this.indent));
        this.write('return');
        if (node.argument) {
            this.write(' ');
            this.generateExpression(node.argument);
        }
        this.write(';\n');
    }

    // Generate BlockStatement
    generateBlockStatement(node, addIndent = true) {
        this.write('{\n');
        if (addIndent) this.increaseIndent();
        else this.indent++;

        for (const stmt of node.body) {
            this.generateStatement(stmt);
        }

        if (addIndent) this.decreaseIndent();
        else this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write('}');
        if (addIndent) this.write('\n');
    }

    // Generate any expression
    generateExpression(node) {
        switch (node.type) {
            case 'Identifier':
                return this.write(node.name);
            case 'Literal':
                return this.generateLiteral(node);
            case 'BinaryExpression':
            case 'LogicalExpression':
                return this.generateBinaryExpression(node);
            case 'UnaryExpression':
                return this.generateUnaryExpression(node);
            case 'AssignmentExpression':
                return this.generateAssignmentExpression(node);
            case 'UpdateExpression':
                return this.generateUpdateExpression(node);
            case 'CallExpression':
                return this.generateCallExpression(node);
            case 'MemberExpression':
                return this.generateMemberExpression(node);
            case 'ConditionalExpression':
                return this.generateConditionalExpression(node);
            case 'ArrayExpression':
                return this.generateArrayExpression(node);
            case 'ObjectExpression':
                return this.generateObjectExpression(node);
            case 'SwitchExpression':
                return this.generateSwitchExpression(node);
            case 'SequenceExpression':
                return this.generateSequenceExpression(node);
            default:
                throw new Error(`Unknown expression type: ${node.type}`);
        }
    }

    // Generate Literal
    generateLiteral(node) {
        if (typeof node.value === 'string') {
            // Escape string and use single quotes
            const escaped = node.value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
            this.write(`'${escaped}'`);
        } else if (node.value === null) {
            this.write('null');
        } else {
            this.write(String(node.value));
        }
    }

    // Generate BinaryExpression
    generateBinaryExpression(node) {
        const currentPrecedence = this.getPrecedence(node);

        // Left child
        const leftPrecedence = this.getPrecedence(node.left);
        if (leftPrecedence < currentPrecedence) {
            this.write('(');
            this.generateExpression(node.left);
            this.write(')');
        } else {
            this.generateExpression(node.left);
        }

        this.write(' ');

        // Convert PineScript operators to JavaScript
        let op = node.operator;
        if (op === 'and') op = '&&';
        else if (op === 'or') op = '||';

        this.write(op);
        this.write(' ');

        // Right child
        const rightPrecedence = this.getPrecedence(node.right);
        let needsRightParens = rightPrecedence < currentPrecedence;

        // Handle associativity for same precedence
        if (rightPrecedence === currentPrecedence) {
            // Subtraction, division, modulo are non-associative (left-associative)
            // so we need parens for right operand
            if (op === '-' || op === '/' || op === '%') {
                needsRightParens = true;
            }
        }

        if (needsRightParens) {
            this.write('(');
            this.generateExpression(node.right);
            this.write(')');
        } else {
            this.generateExpression(node.right);
        }
    }

    // Generate UnaryExpression
    generateUnaryExpression(node) {
        let op = node.operator;
        if (op === 'not') op = '!';

        this.write(op);

        const argPrecedence = this.getPrecedence(node.argument);
        // Unary is 15. If arg < 15, wrap.
        if (argPrecedence < 15) {
            this.write('(');
            this.generateExpression(node.argument);
            this.write(')');
        } else {
            this.generateExpression(node.argument);
        }
    }

    // Generate AssignmentExpression
    generateAssignmentExpression(node) {
        this.generateExpression(node.left);
        this.write(' ');

        // Convert := to =
        let op = node.operator;
        if (op === ':=') op = '=';

        this.write(op);
        this.write(' ');
        this.generateExpression(node.right);
    }

    // Generate UpdateExpression
    generateUpdateExpression(node) {
        if (node.prefix) {
            this.write(node.operator);
            this.generateExpression(node.argument);
        } else {
            this.generateExpression(node.argument);
            this.write(node.operator);
        }
    }

    // Generate CallExpression
    generateCallExpression(node) {
        const calleePrecedence = this.getPrecedence(node.callee);
        if (calleePrecedence < 19) {
            this.write('(');
            this.generateExpression(node.callee);
            this.write(')');
        } else {
            this.generateExpression(node.callee);
        }

        this.write('(');

        for (let i = 0; i < node.arguments.length; i++) {
            const arg = node.arguments[i];

            // Handle named arguments (convert to object parameter)
            if (arg.type === 'AssignmentExpression' && arg.operator === '=') {
                // For named args, we'll just pass the value
                // The calling convention would need to be adjusted
                this.generateExpression(arg.right);
            } else {
                this.generateExpression(arg);
            }

            if (i < node.arguments.length - 1) {
                this.write(', ');
            }
        }

        this.write(')');
    }

    // Generate MemberExpression
    generateMemberExpression(node) {
        const objPrecedence = this.getPrecedence(node.object);
        if (objPrecedence < 19) {
            this.write('(');
            this.generateExpression(node.object);
            this.write(')');
        } else {
            this.generateExpression(node.object);
        }

        if (node.computed) {
            this.write('[');
            this.generateExpression(node.property);
            this.write(']');
        } else {
            this.write('.');
            this.generateExpression(node.property);
        }
    }

    // Generate ConditionalExpression (ternary or IIFE)
    generateConditionalExpression(node) {
        // Check if this needs to be an IIFE (multi-statement or control flow)
        if (node.needsIIFE) {
            this.generateIIFEConditional(node);
            return;
        }

        // Simple ternary
        this.write('(');
        this.generateExpression(node.test);
        this.write(' ? ');
        this.generateExpression(node.consequent);
        this.write(' : ');
        this.generateExpression(node.alternate);
        this.write(')');
    }

    // Generate IIFE for complex if expressions
    generateIIFEConditional(node) {
        this.write('(() => {\n');
        this.indent++;

        // Generate if statement with proper returns
        this.generateIIFEIfBlock(node);

        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write('})()');
    }

    // Helper to generate if block inside IIFE with returns
    generateIIFEIfBlock(node) {
        this.write(this.indentStr.repeat(this.indent));
        this.write('if (');
        this.generateExpression(node.test);
        this.write(') {\n');
        this.indent++;

        // Generate consequent statements
        if (node.consequentStmts) {
            for (let i = 0; i < node.consequentStmts.length; i++) {
                const stmt = node.consequentStmts[i];
                const isLast = i === node.consequentStmts.length - 1;

                if (isLast) {
                    // Last statement - check if it needs special handling
                    if (stmt.type === 'ExpressionStatement') {
                        // Simple expression - add return
                        this.write(this.indentStr.repeat(this.indent));
                        this.write('return ');
                        this.generateExpression(stmt.expression);
                        this.write(';\n');
                    } else if (stmt.type === 'IfStatement') {
                        // Nested if statement - generate as proper if/else with returns
                        this.generateNestedIfWithReturns(stmt);
                    } else {
                        this.generateStatement(stmt);
                    }
                } else {
                    this.generateStatement(stmt);
                }
            }
        }

        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write('}');

        // Generate alternate
        if (node.alternateExpr) {
            // Nested if expression
            this.write(' else {\n');
            this.indent++;
            this.write(this.indentStr.repeat(this.indent));
            this.write('return ');
            this.generateExpression(node.alternateExpr);
            this.write(';\n');
            this.indent--;
            this.write(this.indentStr.repeat(this.indent));
            this.write('}');
        } else if (node.alternateStmts && node.alternateStmts.length > 0) {
            // Alternate block
            this.write(' else {\n');
            this.indent++;
            for (let i = 0; i < node.alternateStmts.length; i++) {
                const stmt = node.alternateStmts[i];
                const isLast = i === node.alternateStmts.length - 1;

                if (isLast) {
                    // Last statement - check if it needs special handling
                    if (stmt.type === 'ExpressionStatement') {
                        // Simple expression - add return
                        this.write(this.indentStr.repeat(this.indent));
                        this.write('return ');
                        this.generateExpression(stmt.expression);
                        this.write(';\n');
                    } else if (stmt.type === 'IfStatement') {
                        // Nested if statement - generate as proper if/else with returns
                        this.generateNestedIfWithReturns(stmt);
                    } else {
                        this.generateStatement(stmt);
                    }
                } else {
                    this.generateStatement(stmt);
                }
            }
            this.indent--;
            this.write(this.indentStr.repeat(this.indent));
            this.write('}');
        } else {
            //No alternate
            this.write(' else {\n');
            this.indent++;
            this.write(this.indentStr.repeat(this.indent));
            this.write('return false;\n');
            this.indent--;
            this.write(this.indentStr.repeat(this.indent));
            this.write('}');
        }

        this.write('\n');
    }

    // Helper to generate nested if statement with returns (for IIFE)
    generateNestedIfWithReturns(node) {
        this.write(this.indentStr.repeat(this.indent));
        this.write('if (');
        this.generateExpression(node.test);
        this.write(') {\n');
        this.indent++;

        // Generate consequent with returns
        if (node.consequent.type === 'BlockStatement' && node.consequent.body.length > 0) {
            for (let i = 0; i < node.consequent.body.length; i++) {
                const stmt = node.consequent.body[i];
                const isLast = i === node.consequent.body.length - 1;

                if (isLast) {
                    // Last statement - add return
                    if (stmt.type === 'ExpressionStatement') {
                        this.write(this.indentStr.repeat(this.indent));
                        this.write('return ');
                        this.generateExpression(stmt.expression);
                        this.write(';\n');
                    } else if (stmt.type === 'IfStatement') {
                        // Recursively handle nested if
                        this.generateNestedIfWithReturns(stmt);
                    } else {
                        this.generateStatement(stmt);
                    }
                } else {
                    this.generateStatement(stmt);
                }
            }
        }

        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write('}');

        // Generate alternate
        if (node.alternate) {
            if (node.alternate.type === 'IfStatement') {
                // else if - format properly without extra spaces
                this.write(' else ');
                // Don't call generateNestedIfWithReturns directly, manually generate to avoid indent
                this.write('if (');
                this.generateExpression(node.alternate.test);
                this.write(') {\n');
                this.indent++;

                // Handle consequent
                if (node.alternate.consequent.type === 'BlockStatement' && node.alternate.consequent.body.length > 0) {
                    for (let i = 0; i < node.alternate.consequent.body.length; i++) {
                        const stmt = node.alternate.consequent.body[i];
                        const isLast = i === node.alternate.consequent.body.length - 1;

                        if (isLast) {
                            if (stmt.type === 'ExpressionStatement') {
                                this.write(this.indentStr.repeat(this.indent));
                                this.write('return ');
                                this.generateExpression(stmt.expression);
                                this.write(';\n');
                            } else if (stmt.type === 'IfStatement') {
                                this.generateNestedIfWithReturns(stmt);
                            } else {
                                this.generateStatement(stmt);
                            }
                        } else {
                            this.generateStatement(stmt);
                        }
                    }
                }

                this.indent--;
                this.write(this.indentStr.repeat(this.indent));
                this.write('}');

                // Recursively handle further alternates
                this.generateNestedIfAlternates(node.alternate.alternate);
            } else if (node.alternate.type === 'BlockStatement' && node.alternate.body.length > 0) {
                // else block
                this.write(' else {\n');
                this.indent++;

                for (let i = 0; i < node.alternate.body.length; i++) {
                    const stmt = node.alternate.body[i];
                    const isLast = i === node.alternate.body.length - 1;

                    if (isLast) {
                        // Last statement - add return
                        if (stmt.type === 'ExpressionStatement') {
                            this.write(this.indentStr.repeat(this.indent));
                            this.write('return ');
                            this.generateExpression(stmt.expression);
                            this.write(';\n');
                        } else if (stmt.type === 'IfStatement') {
                            // Recursively handle nested if
                            this.generateNestedIfWithReturns(stmt);
                        } else {
                            this.generateStatement(stmt);
                        }
                    } else {
                        this.generateStatement(stmt);
                    }
                }

                this.indent--;
                this.write(this.indentStr.repeat(this.indent));
                this.write('}\n');
            } else {
                this.write(' else {\n');
                this.indent++;
                this.write(this.indentStr.repeat(this.indent));
                this.write('return false;\n');
                this.indent--;
                this.write(this.indentStr.repeat(this.indent));
                this.write('}\n');
            }
        } else {
            this.write('\n');
        }
    }

    // Helper to continue generating else if / else chain
    generateNestedIfAlternates(alternate) {
        if (!alternate) {
            return;
        }

        if (alternate.type === 'IfStatement') {
            // Continue else if chain
            this.write(' else ');
            this.write('if (');
            this.generateExpression(alternate.test);
            this.write(') {\n');
            this.indent++;

            // Handle consequent
            if (alternate.consequent.type === 'BlockStatement' && alternate.consequent.body.length > 0) {
                for (let i = 0; i < alternate.consequent.body.length; i++) {
                    const stmt = alternate.consequent.body[i];
                    const isLast = i === alternate.consequent.body.length - 1;

                    if (isLast) {
                        if (stmt.type === 'ExpressionStatement') {
                            this.write(this.indentStr.repeat(this.indent));
                            this.write('return ');
                            this.generateExpression(stmt.expression);
                            this.write(';\n');
                        } else if (stmt.type === 'IfStatement') {
                            this.generateNestedIfWithReturns(stmt);
                        } else {
                            this.generateStatement(stmt);
                        }
                    } else {
                        this.generateStatement(stmt);
                    }
                }
            }

            this.indent--;
            this.write(this.indentStr.repeat(this.indent));
            this.write('}');

            // Continue recursively
            this.generateNestedIfAlternates(alternate.alternate);
        } else if (alternate.type === 'BlockStatement' && alternate.body.length > 0) {
            // Final else block
            this.write(' else {\n');
            this.indent++;

            for (let i = 0; i < alternate.body.length; i++) {
                const stmt = alternate.body[i];
                const isLast = i === alternate.body.length - 1;

                if (isLast) {
                    if (stmt.type === 'ExpressionStatement') {
                        this.write(this.indentStr.repeat(this.indent));
                        this.write('return ');
                        this.generateExpression(stmt.expression);
                        this.write(';\n');
                    } else if (stmt.type === 'IfStatement') {
                        this.generateNestedIfWithReturns(stmt);
                    } else {
                        this.generateStatement(stmt);
                    }
                } else {
                    this.generateStatement(stmt);
                }
            }

            this.indent--;
            this.write(this.indentStr.repeat(this.indent));
            this.write('}\n');
        } else {
            // No more alternates or empty else
            this.write(' else {\n');
            this.indent++;
            this.write(this.indentStr.repeat(this.indent));
            this.write('return false;\n');
            this.indent--;
            this.write(this.indentStr.repeat(this.indent));
            this.write('}\n');
        }
    }

    // Helper to generate nested if as expression return
    generateNestedIfAsExpression(node) {
        if (node.type === 'IfStatement') {
            this.write('(');
            this.generateExpression(node.test);
            this.write(' ? ');

            // Get value from consequent
            if (node.consequent.type === 'BlockStatement' && node.consequent.body.length > 0) {
                const lastStmt = node.consequent.body[node.consequent.body.length - 1];
                if (lastStmt.type === 'ExpressionStatement') {
                    this.generateExpression(lastStmt.expression);
                } else if (lastStmt.type === 'IfStatement') {
                    this.generateNestedIfAsExpression(lastStmt);
                }
            }

            this.write(' : ');

            // Get value from alternate
            if (node.alternate) {
                if (node.alternate.type === 'IfStatement') {
                    this.generateNestedIfAsExpression(node.alternate);
                } else if (node.alternate.type === 'BlockStatement' && node.alternate.body.length > 0) {
                    const lastStmt = node.alternate.body[node.alternate.body.length - 1];
                    if (lastStmt.type === 'ExpressionStatement') {
                        this.generateExpression(lastStmt.expression);
                    }
                } else {
                    this.write('false');
                }
            } else {
                this.write('false');
            }

            this.write(')');
        }
    }

    // Generate ArrayExpression
    generateArrayExpression(node) {
        this.write('[');
        for (let i = 0; i < node.elements.length; i++) {
            this.generateExpression(node.elements[i]);
            if (i < node.elements.length - 1) {
                this.write(', ');
            }
        }
        this.write(']');
    }

    // Generate ObjectExpression
    generateObjectExpression(node) {
        this.write('{');
        for (let i = 0; i < node.properties.length; i++) {
            const prop = node.properties[i];

            if (prop.key.type === 'Identifier') {
                this.write(prop.key.name);
            } else {
                this.generateExpression(prop.key);
            }

            this.write(': ');
            this.generateExpression(prop.value);

            if (i < node.properties.length - 1) {
                this.write(', ');
            }
        }
        this.write('}');
    }

    // Generate SwitchExpression (convert to IIFE with switch statement or if/else if)
    generateSwitchExpression(node) {
        // If discriminant is null, it's a switch without expression - convert to if/else if
        if (node.discriminant === null) {
            this.generateSwitchAsIfElse(node);
            return;
        }

        this.write('(() => {\n');
        this.indent++;
        this.write(this.indentStr.repeat(this.indent));

        this.write('switch (');
        this.generateExpression(node.discriminant);
        this.write(') {\n');

        this.indent++;

        for (const c of node.cases) {
            this.write(this.indentStr.repeat(this.indent));

            if (c.test) {
                this.write('case ');
                this.generateExpression(c.test);
                this.write(':\n');
            } else {
                this.write('default:\n');
            }

            this.indent++;

            // If case has multiple statements, generate all of them
            if (c.statements && c.statements.length > 0) {
                // Check if last statement is actually a value-producing statement
                const lastStmt = c.statements[c.statements.length - 1];
                const hasReturnValue = lastStmt.type === 'ExpressionStatement' || lastStmt.type === 'VariableDeclaration';

                if (hasReturnValue) {
                    // Generate all statements except the last one
                    for (let i = 0; i < c.statements.length - 1; i++) {
                        this.write(this.indentStr.repeat(this.indent));
                        this.generateStatement(c.statements[i]);
                    }
                    // Generate return with the last statement's value
                    this.write(this.indentStr.repeat(this.indent));
                    this.write('return ');
                    // If last statement is an ExpressionStatement, use its expression
                    if (lastStmt.type === 'ExpressionStatement') {
                        this.generateExpression(lastStmt.expression);
                    } else {
                        this.generateExpression(c.consequent);
                    }
                    this.write(';\n');
                } else {
                    // All statements are side-effect only (like IfStatement), generate all of them
                    for (let i = 0; i < c.statements.length; i++) {
                        this.write(this.indentStr.repeat(this.indent));
                        this.generateStatement(c.statements[i]);
                    }
                    // Add explicit return null
                    this.write(this.indentStr.repeat(this.indent));
                    this.write('return null;\n');
                }
            } else {
                // Single expression case
                this.write(this.indentStr.repeat(this.indent));
                this.write('return ');
                this.generateExpression(c.consequent);
                this.write(';\n');
            }

            this.indent--;
        }

        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write('}\n'); // end switch

        this.indent--;
        this.write(this.indentStr.repeat(this.indent));
        this.write('})()');
    }

    // Generate switch without discriminant as if/else if/else chain
    generateSwitchAsIfElse(node) {
        for (let i = 0; i < node.cases.length; i++) {
            const c = node.cases[i];

            if (c.test) {
                // Regular case with a condition
                if (i === 0) {
                    this.write('if (');
                } else {
                    this.write(' else if (');
                }
                this.generateExpression(c.test);
                this.write(') {\n');
            } else {
                // Default case (no test)
                if (i > 0) {
                    this.write(' else {\n');
                } else {
                    // If default is the first (and only) case, just execute the statements
                    this.write('{\n');
                }
            }

            this.indent++;

            // Generate all statements in the case
            if (c.statements && c.statements.length > 0) {
                for (const stmt of c.statements) {
                    this.write(this.indentStr.repeat(this.indent));
                    this.generateStatement(stmt);
                }
            } else {
                // Single expression
                this.write(this.indentStr.repeat(this.indent));
                this.generateExpression(c.consequent);
                this.write(';\n');
            }

            this.indent--;
            this.write(this.indentStr.repeat(this.indent));
            this.write('}');

            // Add newline after closing brace, except for the last case
            if (i < node.cases.length - 1) {
                // No newline here, the next iteration will add 'else'
            } else {
                this.write('\n');
            }
        }
    }

    // Generate SequenceExpression
    generateSequenceExpression(node) {
        this.write('(');
        for (let i = 0; i < node.expressions.length; i++) {
            this.generateExpression(node.expressions[i]);
            if (i < node.expressions.length - 1) {
                this.write(', ');
            }
        }
        this.write(')');
    }

    // Get operator precedence
    getPrecedence(node) {
        switch (node.type) {
            case 'Literal':
            case 'Identifier':
            case 'ArrayExpression':
            case 'ObjectExpression':
                return 20;
            case 'CallExpression':
            case 'MemberExpression':
                return 19;
            case 'UnaryExpression':
            case 'UpdateExpression':
                return 15; // !, +, -, ++, --
            case 'BinaryExpression':
            case 'LogicalExpression':
                switch (node.operator) {
                    case '*':
                    case '/':
                    case '%':
                        return 13;
                    case '+':
                    case '-':
                        return 12;
                    case '<':
                    case '<=':
                    case '>':
                    case '>=':
                        return 10;
                    case '==':
                    case '!=':
                        return 9;
                    case 'and': // PineScript 'and'
                    case '&&':
                        return 5;
                    case 'or': // PineScript 'or'
                    case '||':
                        return 4;
                    default:
                        return 0;
                }
            case 'ConditionalExpression':
                return 3;
            case 'AssignmentExpression':
            case 'AssignmentPattern':
                return 2;
            case 'SequenceExpression':
                return 1;
            default:
                return 0;
        }
    }
}
