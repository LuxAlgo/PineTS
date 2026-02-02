// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

// AST Node Definitions for PineScript
// These will be transformed to ESTree format

export class ASTNode {
    constructor(public type: string) {}
}

// Program root
export class Program extends ASTNode {
    constructor(public body: any[]) {
        super('Program');
    }
}

// Statements
export class ExpressionStatement extends ASTNode {
    constructor(public expression: any) {
        super('ExpressionStatement');
    }
}

export enum VariableDeclarationKind {
    VAR = 'var',
    LET = 'let',
    CONST = 'const',
}
export class VariableDeclaration extends ASTNode {
    constructor(public declarations: any[], public kind: VariableDeclarationKind = VariableDeclarationKind.LET) {
        super('VariableDeclaration');
    }
}

export class VariableDeclarator extends ASTNode {
    constructor(public id: any, public init: any, public varType: any = null) {
        super('VariableDeclarator');
    }
}

export class FunctionDeclaration extends ASTNode {
    constructor(public id: any, public params: any[], public body: any, public returnType: any = null) {
        super('FunctionDeclaration');
    }
}

export class TypeDefinition extends ASTNode {
    constructor(public name: string, public fields: any[]) {
        super('TypeDefinition');
    }
}

export class IfStatement extends ASTNode {
    public _line: number;
    constructor(public test: any, public consequent: any, public alternate: any | null = null) {
        super('IfStatement');
    }
}

export class ForStatement extends ASTNode {
    public isForIn: boolean;
    constructor(public init: any, public test: any, public update: any, public body: any) {
        super('ForStatement');
    }
}

export class WhileStatement extends ASTNode {
    constructor(public test: any, public body: any) {
        super('WhileStatement');
    }
}

export class BlockStatement extends ASTNode {
    constructor(public body: any[]) {
        super('BlockStatement');
    }
}

export class ReturnStatement extends ASTNode {
    constructor(public argument: any) {
        super('ReturnStatement');
    }
}

// Expressions
export class Identifier extends ASTNode {
    public varType: string;
    public returnType: any;
    public isMethod: boolean;
    constructor(public name: string) {
        super('Identifier');
    }
}

export class Literal extends ASTNode {
    constructor(public value: any, public raw: string = null) {
        super('Literal');
    }
}

export class BinaryExpression extends ASTNode {
    constructor(public operator: string, public left: any, public right: any) {
        super('BinaryExpression');
    }
}

export class UnaryExpression extends ASTNode {
    constructor(public operator: string, public argument: any, public prefix: boolean = true) {
        super('UnaryExpression');
    }
}

export class AssignmentExpression extends ASTNode {
    constructor(public operator: string, public left: any, public right: any) {
        super('AssignmentExpression');
    }
}

export class UpdateExpression extends ASTNode {
    constructor(public operator: string, public argument: any, public prefix: boolean = false) {
        super('UpdateExpression');
    }
}

export class CallExpression extends ASTNode {
    public arguments: any[];
    constructor(public callee: any, public args: any[]) {
        super('CallExpression');
        this.callee = callee;
        this.arguments = args;
    }
}

export class MemberExpression extends ASTNode {
    constructor(public object: any, public property: any, public computed: boolean = false) {
        super('MemberExpression');
    }
}

export class ConditionalExpression extends ASTNode {
    public needsIIFE: boolean;
    public consequentStmts: any[];
    public alternateStmts: any[];
    constructor(public test: any, public consequent: any, public alternate: any) {
        super('ConditionalExpression');
    }
}

export class ArrayExpression extends ASTNode {
    constructor(public elements: any[]) {
        super('ArrayExpression');
    }
}

export class ObjectExpression extends ASTNode {
    constructor(public properties: any[]) {
        super('ObjectExpression');
    }
}

export class Property extends ASTNode {
    public kind: string;
    public method: boolean;
    public shorthand: boolean;
    public computed: boolean;
    constructor(public key: any, public value: any) {
        super('Property');
        this.kind = 'init';
        this.method = false;
        this.shorthand = false;
        this.computed = false;
    }
}

export class ArrayPattern extends ASTNode {
    constructor(public elements: any[]) {
        super('ArrayPattern');
    }
}

export class AssignmentPattern extends ASTNode {
    constructor(public left: any, public right: any) {
        super('AssignmentPattern');
    }
}

export class ArrowFunctionExpression extends ASTNode {
    constructor(public params: any[], public body: any, public expression: boolean = false) {
        super('ArrowFunctionExpression');
    }
}

// PineScript-specific (will be transformed)
export class SwitchExpression extends ASTNode {
    constructor(public discriminant: any, public cases: any[]) {
        super('SwitchExpression');
    }
}

export class SwitchCase extends ASTNode {
    constructor(public test: any, public consequent: any, public statements?: any[]) {
        super('SwitchCase');
        // If statements are provided, store them; otherwise consequent is a single expression
        this.statements = statements;
    }
}
