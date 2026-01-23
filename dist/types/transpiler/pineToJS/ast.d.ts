export declare class ASTNode {
    type: string;
    constructor(type: string);
}
export declare class Program extends ASTNode {
    body: any[];
    constructor(body: any[]);
}
export declare class ExpressionStatement extends ASTNode {
    expression: any;
    constructor(expression: any);
}
export declare enum VariableDeclarationKind {
    VAR = "var",
    LET = "let",
    CONST = "const"
}
export declare class VariableDeclaration extends ASTNode {
    declarations: any[];
    kind: VariableDeclarationKind;
    constructor(declarations: any[], kind?: VariableDeclarationKind);
}
export declare class VariableDeclarator extends ASTNode {
    id: any;
    init: any;
    varType: any;
    constructor(id: any, init: any, varType?: any);
}
export declare class FunctionDeclaration extends ASTNode {
    id: any;
    params: any[];
    body: any;
    returnType: any;
    constructor(id: any, params: any[], body: any, returnType?: any);
}
export declare class TypeDefinition extends ASTNode {
    name: string;
    fields: any[];
    constructor(name: string, fields: any[]);
}
export declare class IfStatement extends ASTNode {
    test: any;
    consequent: any;
    alternate: any | null;
    _line: number;
    constructor(test: any, consequent: any, alternate?: any | null);
}
export declare class ForStatement extends ASTNode {
    init: any;
    test: any;
    update: any;
    body: any;
    isForIn: boolean;
    constructor(init: any, test: any, update: any, body: any);
}
export declare class WhileStatement extends ASTNode {
    test: any;
    body: any;
    constructor(test: any, body: any);
}
export declare class BlockStatement extends ASTNode {
    body: any[];
    constructor(body: any[]);
}
export declare class ReturnStatement extends ASTNode {
    argument: any;
    constructor(argument: any);
}
export declare class Identifier extends ASTNode {
    name: string;
    varType: string;
    returnType: any;
    isMethod: boolean;
    constructor(name: string);
}
export declare class Literal extends ASTNode {
    value: any;
    raw: string;
    constructor(value: any, raw?: string);
}
export declare class BinaryExpression extends ASTNode {
    operator: string;
    left: any;
    right: any;
    constructor(operator: string, left: any, right: any);
}
export declare class UnaryExpression extends ASTNode {
    operator: string;
    argument: any;
    prefix: boolean;
    constructor(operator: string, argument: any, prefix?: boolean);
}
export declare class AssignmentExpression extends ASTNode {
    operator: string;
    left: any;
    right: any;
    constructor(operator: string, left: any, right: any);
}
export declare class UpdateExpression extends ASTNode {
    operator: string;
    argument: any;
    prefix: boolean;
    constructor(operator: string, argument: any, prefix?: boolean);
}
export declare class CallExpression extends ASTNode {
    callee: any;
    args: any[];
    arguments: any[];
    constructor(callee: any, args: any[]);
}
export declare class MemberExpression extends ASTNode {
    object: any;
    property: any;
    computed: boolean;
    constructor(object: any, property: any, computed?: boolean);
}
export declare class ConditionalExpression extends ASTNode {
    test: any;
    consequent: any;
    alternate: any;
    needsIIFE: boolean;
    consequentStmts: any[];
    alternateStmts: any[];
    constructor(test: any, consequent: any, alternate: any);
}
export declare class ArrayExpression extends ASTNode {
    elements: any[];
    constructor(elements: any[]);
}
export declare class ObjectExpression extends ASTNode {
    properties: any[];
    constructor(properties: any[]);
}
export declare class Property extends ASTNode {
    key: any;
    value: any;
    kind: string;
    method: boolean;
    shorthand: boolean;
    computed: boolean;
    constructor(key: any, value: any);
}
export declare class ArrayPattern extends ASTNode {
    elements: any[];
    constructor(elements: any[]);
}
export declare class AssignmentPattern extends ASTNode {
    left: any;
    right: any;
    constructor(left: any, right: any);
}
export declare class ArrowFunctionExpression extends ASTNode {
    params: any[];
    body: any;
    expression: boolean;
    constructor(params: any[], body: any, expression?: boolean);
}
export declare class SwitchExpression extends ASTNode {
    discriminant: any;
    cases: any[];
    constructor(discriminant: any, cases: any[]);
}
export declare class SwitchCase extends ASTNode {
    test: any;
    consequent: any;
    constructor(test: any, consequent: any);
}
