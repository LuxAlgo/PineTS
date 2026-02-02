// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import * as walk from 'acorn-walk';
import ScopeManager from '../analysis/ScopeManager';
import { ASTFactory, CONTEXT_NAME } from '../utils/ASTFactory';
import { KNOWN_NAMESPACES, NAMESPACES_LIKE, ASYNC_METHODS } from '../settings';

const UNDEFINED_ARG = {
    type: 'Identifier',
    name: 'undefined',
};

export function createScopedVariableReference(name: string, scopeManager: ScopeManager): any {
    const [scopedName, kind] = scopeManager.getVariable(name);

    // Check if function scoped and not $$ itself
    if (scopedName.match(/^fn\d+_/) && name !== '$$') {
        const [localCtxName] = scopeManager.getVariable('$$');
        // Only if $$ is actually found (it should be in function scope)
        if (localCtxName) {
            return ASTFactory.createLocalContextVariableReference(kind, scopedName);
        }
    }
    return ASTFactory.createContextVariableReference(kind, scopedName);
}

export function createScopedVariableAccess(name: string, scopeManager: ScopeManager): any {
    const varRef = createScopedVariableReference(name, scopeManager);
    return ASTFactory.createGetCall(varRef, 0);
}

export function transformArrayIndex(node: any, scopeManager: ScopeManager): void {
    if (node.computed && node.property.type === 'Identifier') {
        // If index is a loop variable, we still need to transform the object to use $.get()
        if (scopeManager.isLoopVariable(node.property.name)) {
            // Transform the object if it's a context-bound variable
            if (node.object.type === 'Identifier' && !scopeManager.isLoopVariable(node.object.name)) {
                if (!scopeManager.isContextBound(node.object.name)) {
                    // Transform to $.get($.kind.scopedName, loopVar)
                    const contextVarRef = createScopedVariableReference(node.object.name, scopeManager);
                    const getCall = ASTFactory.createGetCall(contextVarRef, node.property);
                    Object.assign(node, getCall);
                    node._indexTransformed = true;
                }
            }
            return;
        }

        // Only transform if it's not a context-bound variable
        if (!scopeManager.isContextBound(node.property.name)) {
            // Transform property to $.kind.scopedName
            node.property = createScopedVariableReference(node.property.name, scopeManager);

            // Add [0] to the index: $.get($.kind.scopedName, 0)
            node.property = ASTFactory.createGetCall(node.property, 0);
        }
    }

    if (node.computed && node.object.type === 'Identifier') {
        if (scopeManager.isLoopVariable(node.object.name)) {
            return;
        }

        if (!scopeManager.isContextBound(node.object.name)) {
            // Transform the object to scoped variable: $.kind.scopedName
            node.object = createScopedVariableReference(node.object.name, scopeManager);
        }

        if (node.property.type === 'MemberExpression') {
            const memberNode = node.property;
            if (!memberNode._indexTransformed) {
                transformArrayIndex(memberNode, scopeManager);
                memberNode._indexTransformed = true;
            }
        }
    }
}

export function addArrayAccess(node: any, scopeManager: ScopeManager): void {
    const memberExpr = ASTFactory.createGetCall(ASTFactory.createIdentifier(node.name), 0);
    // Preserve location info if available
    if (node.start !== undefined) memberExpr.start = node.start;
    if (node.end !== undefined) memberExpr.end = node.end;

    memberExpr._indexTransformed = true;
    Object.assign(node, memberExpr);
}

export function transformIdentifier(node: any, scopeManager: ScopeManager): void {
    // Transform identifiers to use the context object
    if (node.name !== CONTEXT_NAME) {
        // Special handling for 'na' - replace with NaN unless it's a function call
        if (node.name === 'na') {
            const isFunctionCall = node.parent && node.parent.type === 'CallExpression' && node.parent.callee === node;
            if (!isFunctionCall) {
                node.name = 'NaN';
                return;
            }
        }

        // Skip transformation for global and native objects
        if (
            node.name === 'Math' ||
            node.name === 'NaN' ||
            node.name === 'undefined' ||
            node.name === 'Infinity' ||
            node.name === 'null' ||
            (node.name.startsWith("'") && node.name.endsWith("'")) ||
            (node.name.startsWith('"') && node.name.endsWith('"')) ||
            (node.name.startsWith('`') && node.name.endsWith('`'))
        ) {
            return;
        }

        // Skip transformation for loop variables
        if (scopeManager.isLoopVariable(node.name)) {
            return;
        }

        // Determine if this identifier is a function argument that expects a Series object
        let isSeriesFunctionArg = false;
        if (node.parent && node.parent.type === 'CallExpression' && node.parent.arguments.includes(node)) {
            const callee = node.parent.callee;

            // Check for context methods $.get, $.set, $.init, $.param, $.call
            const isContextMethod =
                callee.type === 'MemberExpression' &&
                callee.object &&
                callee.object.name === CONTEXT_NAME &&
                ['get', 'set', 'init', 'param', 'call'].includes(callee.property.name);

            if (isContextMethod) {
                const argIndex = node.parent.arguments.indexOf(node);
                if (callee.property.name === 'call') {
                    // For .call(fn, id, ...args), arguments starting from index 2 are the function arguments
                    // and should be passed as Series objects (isSeriesFunctionArg = true)
                    if (argIndex >= 2) {
                        isSeriesFunctionArg = true;
                    }
                } else if (argIndex === 0) {
                    isSeriesFunctionArg = true;
                }
            } else {
                // For all other functions (including namespace and user-defined), pass Series
                // UNLESS it is a method call on a variable that is NOT a known namespace
                const isNamespaceCall =
                    callee.type === 'MemberExpression' &&
                    callee.object &&
                    callee.object.type === 'Identifier' &&
                    KNOWN_NAMESPACES.includes(callee.object.name);

                if (callee.type === 'MemberExpression' && !isNamespaceCall) {
                    // Method call on a local variable (e.g. array instance: a.indexof(val))
                    // Arguments should be unwrapped to values ($.get)
                    isSeriesFunctionArg = false;
                } else {
                    isSeriesFunctionArg = true;
                }
            }
        }

        // Check if this identifier is part of a namespace member access (e.g., ta.ema)
        const isNamespaceMember =
            node.parent && node.parent.type === 'MemberExpression' && node.parent.object === node && scopeManager.isContextBound(node.name);

        // Check if this identifier is part of a param() call
        const isParamCall =
            node.parent &&
            node.parent.type === 'CallExpression' &&
            node.parent.callee &&
            node.parent.callee.type === 'MemberExpression' &&
            node.parent.callee.property.name === 'param';

        const isInit = node.parent && node.parent.type === 'AssignmentExpression' && node.parent.left === node;

        // Check if this identifier is a function being called
        const isFunctionCall = node.parent && node.parent.type === 'CallExpression' && node.parent.callee === node;

        // Check if parent node is already a member expression with computed property (array access)
        const hasArrayAccess = node.parent && node.parent.type === 'MemberExpression' && node.parent.computed && node.parent.object === node;

        // Check if this identifier is part of an array access that's an argument to a namespace function
        const isArrayIndexInNamespaceCall =
            node.parent &&
            node.parent.type === 'MemberExpression' &&
            node.parent.computed &&
            node.parent.property === node &&
            node.parent.parent &&
            node.parent.parent.type === 'CallExpression' &&
            node.parent.parent.callee &&
            node.parent.parent.callee.type === 'MemberExpression' &&
            scopeManager.isContextBound(node.parent.parent.callee.object.name);

        if (isNamespaceMember || isParamCall || isSeriesFunctionArg || isArrayIndexInNamespaceCall || isFunctionCall) {
            // For function calls, we should just use the original name without scoping
            if (isFunctionCall) {
                return;
            }

            // FIX: Don't transform function identifier if it's the first argument to $.call(fn, id, ...)
            if (
                node.parent &&
                node.parent.type === 'CallExpression' &&
                node.parent.callee &&
                node.parent.callee.type === 'MemberExpression' &&
                node.parent.callee.object &&
                node.parent.callee.object.name === CONTEXT_NAME &&
                node.parent.callee.property.name === 'call' &&
                node.parent.arguments[0] === node
            ) {
                return;
            }

            // For local series variables (hoisted params), don't rename or wrap if they are args to a namespace function
            if (scopeManager.isLocalSeriesVar(node.name)) {
                return;
            }

            // If it's a nested function parameter or context bound variable (but not a root parameter), skip transformation
            // This protects built-ins like 'close' from being resolved to '$.let.close' when passed as arguments
            if (scopeManager.isContextBound(node.name) && !scopeManager.isRootParam(node.name)) {
                return;
            }

            // Don't add [0] for namespace function arguments or array indices
            const memberExpr = createScopedVariableReference(node.name, scopeManager);
            Object.assign(node, memberExpr);
            return;
        }

        const isContextBoundVar = scopeManager.isContextBound(node.name) && !scopeManager.isRootParam(node.name);

        if (isContextBoundVar) {
            const isFunctionArg = node.parent && node.parent.type === 'CallExpression' && node.parent.arguments.includes(node);
            const isSwitchDiscriminant = node.parent && node.parent.type === 'SwitchStatement' && node.parent.discriminant === node;
            const isSwitchCaseTest = node.parent && node.parent.type === 'SwitchCase' && node.parent.test === node;

            if (!isFunctionArg && !isSwitchDiscriminant && !isSwitchCaseTest) {
                // Return early if it's not a function arg or switch test that needs unwrapping
                return;
            }
        }

        // For local series variables used elsewhere (e.g. in plot() or binary ops), we MIGHT need to wrap them
        // But we definitely shouldn't rename them to $.let...
        if (scopeManager.isLocalSeriesVar(node.name)) {
            // If it's not an array access, we need to wrap it in $.get(node, 0) to get the value
            if (!hasArrayAccess) {
                const memberExpr = ASTFactory.createIdentifier(node.name);
                const accessExpr = ASTFactory.createGetCall(memberExpr, 0);
                Object.assign(node, accessExpr);
            }
            return;
        }

        const [scopedName, kind] = scopeManager.getVariable(node.name);

        let memberExpr;
        if (isContextBoundVar) {
            // Use identifier directly for context bound vars (avoid $.let)
            memberExpr = ASTFactory.createIdentifier(node.name);
        } else {
            if (scopedName === node.name && !scopeManager.isContextBound(node.name)) {
                return; // Global/unknown var, return as is
            }
            memberExpr = createScopedVariableReference(node.name, scopeManager);
        }

        if (!hasArrayAccess) {
            const accessExpr = ASTFactory.createGetCall(memberExpr, 0);
            Object.assign(node, accessExpr);
        } else {
            Object.assign(node, memberExpr);
        }
    }
}

export function transformMemberExpression(memberNode: any, originalParamName: string, scopeManager: ScopeManager): void {
    // Skip transformation for Math object properties
    if (memberNode.object && memberNode.object.type === 'Identifier' && memberNode.object.name === 'Math') {
        return;
    }

    // Check if this is a direct namespace method access without parentheses (e.g., ta.tr, math.pi)
    // Only apply to known Pine Script namespaces: ta, math, request, array, input
    // If so, convert it to a call expression (e.g., ta.tr(), math.pi())
    const isDirectNamespaceMemberAccess =
        memberNode.object &&
        memberNode.object.type === 'Identifier' &&
        KNOWN_NAMESPACES.includes(memberNode.object.name) &&
        scopeManager.isContextBound(memberNode.object.name) &&
        !memberNode.computed;

    if (isDirectNamespaceMemberAccess) {
        // Check if this member expression is NOT already the callee of a CallExpression
        const isAlreadyBeingCalled = memberNode.parent && memberNode.parent.type === 'CallExpression' && memberNode.parent.callee === memberNode;

        // Check if this is part of a destructuring pattern (array or object destructuring)
        // We want to skip only for actual destructuring, not simple assignments
        const isInDestructuring =
            memberNode.parent &&
            ((memberNode.parent.type === 'VariableDeclarator' &&
                (memberNode.parent.id.type === 'ArrayPattern' || memberNode.parent.id.type === 'ObjectPattern')) ||
                (memberNode.parent.type === 'AssignmentExpression' &&
                    (memberNode.parent.left.type === 'ArrayPattern' || memberNode.parent.left.type === 'ObjectPattern')) ||
                memberNode.parent.type === 'Property');

        if (!isAlreadyBeingCalled && !isInDestructuring) {
            // Convert namespace.method to namespace.method()
            const callExpr: any = {
                type: 'CallExpression',
                callee: {
                    type: 'MemberExpression',
                    object: memberNode.object,
                    property: memberNode.property,
                    computed: false,
                },
                arguments: [],
                _transformed: false, // Allow further transformation of this call
            };

            // Preserve location info
            if (memberNode.start !== undefined) callExpr.start = memberNode.start;
            if (memberNode.end !== undefined) callExpr.end = memberNode.end;

            Object.assign(memberNode, callExpr);
            return;
        }
    }

    //if statment variables always need to be transformed
    const isIfStatement = scopeManager.getCurrentScopeType() == 'if';
    const isElseStatement = scopeManager.getCurrentScopeType() == 'els';
    const isForStatement = scopeManager.getCurrentScopeType() == 'for';
    // If the object is a context-bound variable (like a function parameter), skip transformation
    // But if it's a computed access (array access), we must process it to use $.get()
    if (
        !isIfStatement &&
        !isElseStatement &&
        !isForStatement &&
        memberNode.object &&
        memberNode.object.type === 'Identifier' &&
        scopeManager.isContextBound(memberNode.object.name) &&
        !scopeManager.isRootParam(memberNode.object.name) &&
        !memberNode.computed // Allow computed properties to proceed
    ) {
        return;
    }

    // Transform array indices
    if (!memberNode._indexTransformed) {
        transformArrayIndex(memberNode, scopeManager);
        memberNode._indexTransformed = true;
    }

    // Convert to $.get(object, property) if it's a computed access on a context variable
    const isContextMemberAccess =
        memberNode.object &&
        memberNode.object.type === 'MemberExpression' &&
        memberNode.object.object &&
        memberNode.object.object.type === 'MemberExpression' &&
        memberNode.object.object.object &&
        (memberNode.object.object.object.name === CONTEXT_NAME || memberNode.object.object.object.name === '$$');

    const isContextBoundIdentifier =
        memberNode.object && memberNode.object.type === 'Identifier' && scopeManager.isContextBound(memberNode.object.name);

    if (memberNode.computed && (isContextMemberAccess || isContextBoundIdentifier)) {
        // Check if this is LHS of an assignment
        if (memberNode.parent && memberNode.parent.type === 'AssignmentExpression' && memberNode.parent.left === memberNode) {
            return;
        }

        const getCall = ASTFactory.createGetCall(memberNode.object, memberNode.property);

        // Preserve location
        if (memberNode.start) getCall.start = memberNode.start;
        if (memberNode.end) getCall.end = memberNode.end;

        Object.assign(memberNode, getCall);

        // Delete old MemberExpression properties to avoid accidental traversal
        delete memberNode.object;
        delete memberNode.property;
        delete memberNode.computed;
    }
}

// Helper for transformFunctionArgument
function transformIdentifierForParam(node: any, scopeManager: ScopeManager): any {
    if (node.type === 'Identifier') {
        if (node.name === 'na') {
            node.name = 'NaN';
            return node;
        }

        // Skip transformation for loop variables
        if (scopeManager.isLoopVariable(node.name)) {
            return node;
        }

        // If it's a root parameter, transform it with $.let prefix
        if (scopeManager.isRootParam(node.name)) {
            const [scopedName, kind] = scopeManager.getVariable(node.name);
            return ASTFactory.createContextVariableReference(kind, scopedName);
        }

        // If it's a nested function parameter or other context-bound variable, return as is
        // NOTE: isContextBound now returns false for JavaScript globals like Infinity, NaN, etc.
        if (scopeManager.isContextBound(node.name)) {
            return node;
        }

        // Check if there's a user-defined variable with this name before treating as local series
        // This handles the case where internal parameter names (p1, p2, etc.) collide with user variables
        const [scopedName, kind] = scopeManager.getVariable(node.name);
        const isUserVariable = scopedName !== node.name; // If renamed, it's a user variable

        // If it's a local series variable (hoisted parameter) AND NOT a user variable, return as is
        if (scopeManager.isLocalSeriesVar(node.name) && !isUserVariable) {
            return node;
        }

        // If it's a user variable, transform it
        if (isUserVariable) {
            return createScopedVariableReference(node.name, scopeManager);
        }

        // JavaScript global literals should never be transformed
        // Variable not found in scopes and not context-bound
        if (scopedName === node.name && !scopeManager.isContextBound(node.name)) {
            return node; // Return as-is to preserve JavaScript globals
        }

        // Otherwise transform with context variable reference (shouldn't reach here in normal cases)
        return createScopedVariableReference(node.name, scopeManager);
    }
    return node;
}

function transformOperand(node: any, scopeManager: ScopeManager, namespace: string = ''): any {
    switch (node.type) {
        case 'BinaryExpression': {
            return getParamFromBinaryExpression(node, scopeManager, namespace);
        }
        case 'LogicalExpression': {
            return getParamFromLogicalExpression(node, scopeManager, namespace);
        }
        case 'MemberExpression': {
            // Handle array access
            const transformedObject = node.object.type === 'Identifier' ? transformIdentifierForParam(node.object, scopeManager) : node.object;
            // Don't add [0] if this is already an array access
            return {
                type: 'MemberExpression',
                object: transformedObject,
                property: node.property,
                computed: node.computed,
            };
        }
        case 'Identifier': {
            // Skip transformation for loop variables
            if (scopeManager.isLoopVariable(node.name)) {
                return node;
            }
            // Check if this identifier is part of a member expression (array access)
            const isMemberExprProperty = node.parent && node.parent.type === 'MemberExpression' && node.parent.property === node;
            if (isMemberExprProperty) {
                return node;
            }
            const transformedObject = transformIdentifierForParam(node, scopeManager);

            // Skip $.get wrapping for specific constants/globals
            if (
                transformedObject.type === 'Identifier' &&
                (transformedObject.name === 'NaN' ||
                    transformedObject.name === 'undefined' ||
                    transformedObject.name === 'Infinity' ||
                    transformedObject.name === 'null' ||
                    transformedObject.name === 'Math')
            ) {
                return transformedObject;
            }

            return ASTFactory.createGetCall(transformedObject, 0);
        }
        case 'UnaryExpression': {
            return getParamFromUnaryExpression(node, scopeManager, namespace);
        }
        case 'ConditionalExpression': {
            // Transform test, consequent, and alternate
            const transformedTest = transformOperand(node.test, scopeManager, namespace);
            const transformedConsequent = transformOperand(node.consequent, scopeManager, namespace);
            const transformedAlternate = transformOperand(node.alternate, scopeManager, namespace);

            return {
                type: 'ConditionalExpression',
                test: transformedTest,
                consequent: transformedConsequent,
                alternate: transformedAlternate,
                start: node.start,
                end: node.end,
            };
        }
    }

    return node;
}

function getParamFromBinaryExpression(node: any, scopeManager: ScopeManager, namespace: string): any {
    // Transform both operands
    const transformedLeft = transformOperand(node.left, scopeManager, namespace);
    const transformedRight = transformOperand(node.right, scopeManager, namespace);

    // Create the binary expression
    const binaryExpr = {
        type: 'BinaryExpression',
        operator: node.operator,
        left: transformedLeft,
        right: transformedRight,
        start: node.start,
        end: node.end,
    };

    // Walk through the binary expression to transform any function calls
    walk.recursive(binaryExpr, scopeManager, {
        CallExpression(node: any, scopeManager: ScopeManager) {
            if (!node._transformed) {
                transformCallExpression(node, scopeManager);
            }
        },
        MemberExpression(node: any) {
            transformMemberExpression(node, '', scopeManager);
        },
    });

    return binaryExpr;
}

function getParamFromLogicalExpression(node: any, scopeManager: ScopeManager, namespace: string): any {
    // Transform both operands
    const transformedLeft = transformOperand(node.left, scopeManager, namespace);
    const transformedRight = transformOperand(node.right, scopeManager, namespace);

    const logicalExpr = {
        type: 'LogicalExpression',
        operator: node.operator,
        left: transformedLeft,
        right: transformedRight,
        start: node.start,
        end: node.end,
    };

    // Walk through the logical expression to transform any function calls
    walk.recursive(logicalExpr, scopeManager, {
        CallExpression(node: any, scopeManager: ScopeManager) {
            if (!node._transformed) {
                transformCallExpression(node, scopeManager);
            }
        },
    });

    return logicalExpr;
}

function getParamFromConditionalExpression(node: any, scopeManager: ScopeManager, namespace: string): any {
    // Transform identifiers in the right side of the assignment
    walk.recursive(
        node,
        { parent: node, inNamespaceCall: false },
        {
            Identifier(node: any, state: any, c: any) {
                if (node.name == 'NaN') return;
                if (node.name == 'na') {
                    node.name = 'NaN';
                    return;
                }
                node.parent = state.parent;
                transformIdentifier(node, scopeManager);
                const isBinaryOperation = node.parent && node.parent.type === 'BinaryExpression';
                const isConditional = node.parent && node.parent.type === 'ConditionalExpression';

                if (isConditional || isBinaryOperation) {
                    if (node.type === 'MemberExpression') {
                        transformArrayIndex(node, scopeManager);
                    } else if (node.type === 'Identifier') {
                        // Skip addArrayAccess if the identifier is already inside a $.get call
                        const isGetCall =
                            node.parent &&
                            node.parent.type === 'CallExpression' &&
                            node.parent.callee &&
                            node.parent.callee.object &&
                            node.parent.callee.object.name === CONTEXT_NAME &&
                            node.parent.callee.property.name === 'get';

                        if (!isGetCall) {
                            addArrayAccess(node, scopeManager);
                        }
                    }
                }
            },
            MemberExpression(node: any, state: any, c: any) {
                // Transform array indices first
                transformArrayIndex(node, scopeManager);
                // Then continue with object transformation
                if (node.object) {
                    c(node.object, { parent: node, inNamespaceCall: state.inNamespaceCall });
                }
            },
            ConditionalExpression(node: any, state: any, c: any) {
                // Traverse test, consequent, and alternate with correct parent
                const newState = { ...state, parent: node };
                if (node.test) {
                    c(node.test, newState);
                }
                if (node.consequent) {
                    c(node.consequent, newState);
                }
                if (node.alternate) {
                    c(node.alternate, newState);
                }
            },
            BinaryExpression(node: any, state: any, c: any) {
                const newState = { ...state, parent: node };
                c(node.left, newState);
                c(node.right, newState);
            },
            LogicalExpression(node: any, state: any, c: any) {
                const newState = { ...state, parent: node };
                c(node.left, newState);
                c(node.right, newState);
            },
            UnaryExpression(node: any, state: any, c: any) {
                const newState = { ...state, parent: node };
                c(node.argument, newState);
            },
            CallExpression(node: any, state: any, c: any) {
                const isNamespaceCall =
                    node.callee &&
                    node.callee.type === 'MemberExpression' &&
                    node.callee.object &&
                    node.callee.object.type === 'Identifier' &&
                    scopeManager.isContextBound(node.callee.object.name);

                // First transform the call expression itself
                transformCallExpression(node, scopeManager);

                // Then transform its arguments with the correct context
                node.arguments.forEach((arg: any) => c(arg, { parent: node, inNamespaceCall: isNamespaceCall || state.inNamespaceCall }));
            },
        }
    );

    const memberExpr = ASTFactory.createMemberExpression(ASTFactory.createIdentifier(namespace), ASTFactory.createIdentifier('param'));
    const nextParamId = scopeManager.generateParamId();
    const paramCall = {
        type: 'CallExpression',
        callee: memberExpr,
        arguments: [node, UNDEFINED_ARG, { type: 'Identifier', name: `'${nextParamId}'` }],
        _transformed: true,
        _isParamCall: true,
    };

    if (!scopeManager.shouldSuppressHoisting()) {
        const tempVarName = nextParamId;
        scopeManager.addLocalSeriesVar(tempVarName);
        const variableDecl = ASTFactory.createVariableDeclaration(tempVarName, paramCall);
        scopeManager.addHoistedStatement(variableDecl);
        return ASTFactory.createIdentifier(tempVarName);
    }

    return paramCall;
}

function getParamFromUnaryExpression(node: any, scopeManager: ScopeManager, namespace: string): any {
    // Transform the argument
    const transformedArgument = transformOperand(node.argument, scopeManager, namespace);

    // Create the unary expression
    const unaryExpr = {
        type: 'UnaryExpression',
        operator: node.operator,
        prefix: node.prefix,
        argument: transformedArgument,
        start: node.start,
        end: node.end,
    };

    return unaryExpr;
}

export function transformFunctionArgument(arg: any, namespace: string, scopeManager: ScopeManager): any {
    // Handle binary expressions (arithmetic operations)

    switch (arg?.type) {
        case 'BinaryExpression':
            arg = getParamFromBinaryExpression(arg, scopeManager, namespace);
            break;
        case 'LogicalExpression':
            arg = getParamFromLogicalExpression(arg, scopeManager, namespace);
            break;
        case 'ConditionalExpression':
            return getParamFromConditionalExpression(arg, scopeManager, namespace);
        case 'UnaryExpression':
            arg = getParamFromUnaryExpression(arg, scopeManager, namespace);
            break;
        case 'ArrayExpression':
            // Transform each element in the array
            arg.elements = arg.elements.map((element: any) => {
                if (element.type === 'Identifier') {
                    // Transform identifiers to use $.get(variable, 0)
                    if (scopeManager.isContextBound(element.name) && !scopeManager.isRootParam(element.name)) {
                        // It's a data variable like 'close', 'open' - use directly
                        return element;
                    }
                    // It's a user variable - transform to context reference
                    return createScopedVariableAccess(element.name, scopeManager);
                }
                return element;
            });
            break;
    }

    // Check if the argument is an array access (computed member expression)
    const isArrayAccess = arg.type === 'MemberExpression' && arg.computed && arg.property;

    // Check if the argument is a property access (non-computed member expression)
    const isPropertyAccess = arg.type === 'MemberExpression' && !arg.computed;

    if (isArrayAccess) {
        // Ensure complex objects are transformed before being used as array source
        if (arg.object.type === 'CallExpression') {
            transformCallExpression(arg.object, scopeManager);
        } else if (arg.object.type === 'MemberExpression') {
            transformMemberExpression(arg.object, '', scopeManager);
        } else if (arg.object.type === 'BinaryExpression') {
            arg.object = getParamFromBinaryExpression(arg.object, scopeManager, namespace);
        } else if (arg.object.type === 'LogicalExpression') {
            arg.object = getParamFromLogicalExpression(arg.object, scopeManager, namespace);
        } else if (arg.object.type === 'ConditionalExpression') {
            arg.object = getParamFromConditionalExpression(arg.object, scopeManager, namespace);
        } else if (arg.object.type === 'UnaryExpression') {
            arg.object = getParamFromUnaryExpression(arg.object, scopeManager, namespace);
        }

        // Transform array access
        const transformedObject =
            arg.object.type === 'Identifier' && scopeManager.isContextBound(arg.object.name) && !scopeManager.isRootParam(arg.object.name)
                ? arg.object
                : transformIdentifierForParam(arg.object, scopeManager);

        // Transform the index if it's an identifier
        const transformedProperty =
            arg.property.type === 'Identifier' && !scopeManager.isContextBound(arg.property.name) && !scopeManager.isLoopVariable(arg.property.name)
                ? transformIdentifierForParam(arg.property, scopeManager)
                : arg.property;

        const memberExpr = ASTFactory.createMemberExpression(ASTFactory.createIdentifier(namespace), ASTFactory.createIdentifier('param'));

        const nextParamId = scopeManager.generateParamId();
        const paramCall = {
            type: 'CallExpression',
            callee: memberExpr,
            arguments: [transformedObject, transformedProperty, { type: 'Identifier', name: `'${nextParamId}'` }],
            _transformed: true,
            _isParamCall: true,
        };

        if (!scopeManager.shouldSuppressHoisting()) {
            const tempVarName = nextParamId;
            scopeManager.addLocalSeriesVar(tempVarName); // Mark as local series
            const variableDecl = ASTFactory.createVariableDeclaration(tempVarName, paramCall);
            scopeManager.addHoistedStatement(variableDecl);
            return ASTFactory.createIdentifier(tempVarName);
        }

        return paramCall;
    }

    if (isPropertyAccess) {
        // Handle property access like trade.entry
        // Transform the object identifier if it's a user variable
        if (arg.object.type === 'Identifier') {
            const name = arg.object.name;
            const [varName, kind] = scopeManager.getVariable(name);
            const isRenamed = varName !== name;

            // Only transform if the variable has been renamed (i.e., it's a user-defined variable)
            // Context-bound variables that are NOT renamed (like 'display', 'ta', 'input') should NOT be transformed
            if (isRenamed && !scopeManager.isLoopVariable(name)) {
                // Transform object to $.get($.let.varName, 0)
                const contextVarRef = ASTFactory.createContextVariableReference(kind, varName);
                const getCall = ASTFactory.createGetCall(contextVarRef, 0);
                arg.object = getCall;
            }
        } else if (arg.object.type === 'MemberExpression') {
            // Recursively handle nested member expressions like obj.prop1.prop2
            transformFunctionArgument(arg.object, namespace, scopeManager);
        }
    }

    if (arg.type === 'ObjectExpression') {
        arg.properties = arg.properties.map((prop: any) => {
            // Get the variable name and kind
            if (prop.value.name) {
                // If it's a context-bound variable (like 'close', 'open') and not a root param
                if (scopeManager.isContextBound(prop.value.name) && !scopeManager.isRootParam(prop.value.name)) {
                    return {
                        type: 'Property',
                        key: {
                            type: 'Identifier',
                            name: prop.key.name,
                        },
                        value: ASTFactory.createIdentifier(prop.value.name),
                        kind: 'init',
                        method: false,
                        shorthand: false,
                        computed: false,
                    };
                }

                // Convert shorthand to full property definition
                return {
                    type: 'Property',
                    key: {
                        type: 'Identifier',
                        name: prop.key.name,
                    },
                    value: createScopedVariableReference(prop.value.name, scopeManager),
                    kind: 'init',
                    method: false,
                    shorthand: false,
                    computed: false,
                };
            } else if (prop.value.type !== 'Literal') {
                // For complex expressions (CallExpression, BinaryExpression, etc.), recursively transform them
                prop.value = transformFunctionArgument(prop.value, namespace, scopeManager);
            }
            return prop;
        });
    }
    // For non-array-access arguments
    if (arg.type === 'Identifier') {
        if (arg.name === 'na') {
            arg.name = 'NaN';
            return arg;
        }
        // If it's a context-bound variable (like a nested function parameter), use it directly
        if (scopeManager.isContextBound(arg.name) && !scopeManager.isRootParam(arg.name)) {
            const memberExpr = ASTFactory.createMemberExpression(ASTFactory.createIdentifier(namespace), ASTFactory.createIdentifier('param'));
            const nextParamId = scopeManager.generateParamId();
            const paramCall = {
                type: 'CallExpression',
                callee: memberExpr,
                arguments: [arg, UNDEFINED_ARG, { type: 'Identifier', name: `'${nextParamId}'` }],
                _transformed: true,
                _isParamCall: true,
            };

            if (!scopeManager.shouldSuppressHoisting()) {
                const tempVarName = nextParamId;
                scopeManager.addLocalSeriesVar(tempVarName); // Prevent transformation to $.let.pX
                const variableDecl = ASTFactory.createVariableDeclaration(tempVarName, paramCall);
                scopeManager.addHoistedStatement(variableDecl);
                return ASTFactory.createIdentifier(tempVarName);
            }

            return paramCall;
        }
    }

    // For all other cases, transform normally

    if (arg?.type === 'CallExpression') {
        transformCallExpression(arg, scopeManager, namespace);
    }

    const memberExpr = ASTFactory.createMemberExpression(ASTFactory.createIdentifier(namespace), ASTFactory.createIdentifier('param'));

    const transformedArg = arg.type === 'Identifier' ? transformIdentifierForParam(arg, scopeManager) : arg;
    const nextParamId = scopeManager.generateParamId();

    const paramCall = {
        type: 'CallExpression',
        callee: memberExpr,
        arguments: [transformedArg, UNDEFINED_ARG, { type: 'Identifier', name: `'${nextParamId}'` }],
        _transformed: true,
        _isParamCall: true,
    };

    if (!scopeManager.shouldSuppressHoisting()) {
        const tempVarName = nextParamId;
        scopeManager.addLocalSeriesVar(tempVarName);
        const variableDecl = ASTFactory.createVariableDeclaration(tempVarName, paramCall);
        scopeManager.addHoistedStatement(variableDecl);
        return ASTFactory.createIdentifier(tempVarName);
    }

    return paramCall;
}

export function transformCallExpression(node: any, scopeManager: ScopeManager, namespace?: string): void {
    // Skip if this node has already been transformed
    if (node._transformed) {
        return;
    }

    // Check if this is a direct call to a known namespace (e.g. input(...))
    if (
        node.callee &&
        node.callee.type === 'Identifier' &&
        (KNOWN_NAMESPACES.includes(node.callee.name) || NAMESPACES_LIKE.includes(node.callee.name)) &&
        scopeManager.isContextBound(node.callee.name)
    ) {
        // Transform to namespace.any(...)
        node.callee = ASTFactory.createMemberExpression(node.callee, ASTFactory.createIdentifier('any'));
        // Continue processing to handle arguments transformation
    }

    // Check if this is a namespace method call (e.g., ta.ema, math.abs)
    const isNamespaceCall =
        node.callee &&
        node.callee.type === 'MemberExpression' &&
        node.callee.object &&
        node.callee.object.type === 'Identifier' &&
        (scopeManager.isContextBound(node.callee.object.name) || node.callee.object.name === 'math' || node.callee.object.name === 'ta');

    if (isNamespaceCall) {
        // Exclude internal context methods from parameter wrapping
        if (node.callee.object.name === CONTEXT_NAME && ['get', 'init', 'param'].includes(node.callee.property.name)) {
            return;
        }

        const namespace = node.callee.object.name;
        // Transform arguments using the namespace's param
        const newArgs: any[] = [];
        node.arguments.forEach((arg: any) => {
            // If argument is already a param call, don't wrap it again
            if (arg._isParamCall) {
                newArgs.push(arg);
                return;
            }
            newArgs.push(transformFunctionArgument(arg, namespace, scopeManager));
        });
        node.arguments = newArgs;

        // Inject unique call ID for TA functions to enable proper state management
        if (namespace === 'ta') {
            if (scopeManager.getCurrentScopeType() === 'fn') {
                // If inside a function, combine $$.id with the static ID
                const staticId = scopeManager.getNextTACallId();

                // Manually resolve $$ from scope to ensure it uses the scoped variable name
                const [localCtxName] = scopeManager.getVariable('$$');

                let leftOperand;
                if (localCtxName) {
                    // $$.id
                    leftOperand = ASTFactory.createMemberExpression(ASTFactory.createLocalContextIdentifier(), ASTFactory.createIdentifier('id'));
                } else {
                    // Fallback to empty string if not found (should not happen in valid PineTS)
                    leftOperand = ASTFactory.createLiteral('');
                }

                const callIdArg = {
                    type: 'BinaryExpression',
                    operator: '+',
                    left: leftOperand,
                    right: staticId,
                };
                node.arguments.push(callIdArg);
            } else {
                node.arguments.push(scopeManager.getNextTACallId());
            }
        }

        // Check if this is an async method call that needs await
        const methodName = node.callee.property.name;
        const methodPath = `${namespace}.${methodName}`;
        const isAsyncMethod = ASYNC_METHODS.includes(methodPath);

        // Check if already inside an await expression (marked by AwaitExpression handler)
        const isAlreadyAwaited = node._insideAwait === true;

        // If it's an async method and not already awaited, we need to wrap it
        if (isAsyncMethod && !isAlreadyAwaited) {
            // Create a copy of the current node state before wrapping
            const callExpressionCopy = Object.assign({}, node);
            // Wrap in AwaitExpression
            const awaitExpr = ASTFactory.createAwaitExpression(callExpressionCopy);
            // Replace the current node with the AwaitExpression
            Object.assign(node, awaitExpr);
        }

        if (!scopeManager.shouldSuppressHoisting()) {
            const tempVarName = scopeManager.generateTempVar();
            scopeManager.addLocalSeriesVar(tempVarName); // Mark as local series

            // Check if this CallExpression was inside an await expression
            const wasInsideAwait = node._insideAwait === true;

            // Create the variable declaration
            // If it was inside await, wrap the call in an AwaitExpression for the hoisted statement
            let initExpression = Object.assign({}, node);
            if (wasInsideAwait) {
                initExpression = ASTFactory.createAwaitExpression(initExpression);
            }

            const variableDecl = ASTFactory.createVariableDeclaration(tempVarName, initExpression);
            scopeManager.addHoistedStatement(variableDecl);

            // Replace the CallExpression with the temp variable identifier (no await here)
            const tempIdentifier = ASTFactory.createIdentifier(tempVarName);
            Object.assign(node, tempIdentifier);
            // Mark that this identifier came from hoisting AFTER Object.assign to ensure it's preserved
            node._wasHoisted = true;
            node._wasInsideAwait = wasInsideAwait; // Mark so parent AwaitExpression knows to remove itself
            // The original node is modified in place, so we don't need to return anything
            return;
        }

        node._transformed = true;
    }
    // Check if this is a regular function call (not a namespace method)
    else if (node.callee && node.callee.type === 'Identifier') {
        // Transform arguments using $.param
        node.arguments = node.arguments.map((arg: any) => {
            // If argument is already a param call, don't wrap it again
            if (arg._isParamCall) {
                return arg;
            }
            return transformFunctionArgument(arg, CONTEXT_NAME, scopeManager);
        });

        // Inject unique call ID for the function call only if it is a user-defined function
        // Built-in functions (like na, nz, bool) are context-bound and should not receive a call ID
        if (!scopeManager.isContextBound(node.callee.name)) {
            // Use $.call(fn, id, ...args) pattern
            const callId = scopeManager.getNextUserCallId();

            // Create $.call access
            const contextCall = ASTFactory.createMemberExpression(ASTFactory.createContextIdentifier(), ASTFactory.createIdentifier('call'));

            // Construct new arguments list: [originalFn, callId, ...originalArgs]
            const newArgs = [node.callee, callId, ...node.arguments];

            // Update node
            node.callee = contextCall;
            node.arguments = newArgs;
        }

        node._transformed = true;
    }

    // Handle method calls on local variables (e.g. arr.set())
    if (!isNamespaceCall && node.callee && node.callee.type === 'MemberExpression') {
        if (node.callee.object.type === 'Identifier') {
            transformIdentifier(node.callee.object, scopeManager);
        }
    }

    // Transform any nested call expressions in the arguments
    node.arguments.forEach((arg: any) => {
        walk.recursive(
            arg,
            { parent: node },
            {
                Identifier(node: any, state: any, c: any) {
                    node.parent = state.parent;
                    transformIdentifier(node, scopeManager);
                    const isBinaryOperation = node.parent && node.parent.type === 'BinaryExpression';
                    const isConditional = node.parent && node.parent.type === 'ConditionalExpression';

                    if (isConditional || isBinaryOperation) {
                        if (node.type === 'MemberExpression') {
                            transformArrayIndex(node, scopeManager);
                        } else if (node.type === 'Identifier') {
                            // Skip addArrayAccess if the identifier is already inside a $.get call
                            const isGetCall =
                                node.parent &&
                                node.parent.type === 'CallExpression' &&
                                node.parent.callee &&
                                node.parent.callee.object &&
                                node.parent.callee.object.name === CONTEXT_NAME &&
                                node.parent.callee.property.name === 'get';

                            if (!isGetCall) {
                                addArrayAccess(node, scopeManager);
                            }
                        }
                    }
                },
                BinaryExpression(node: any, state: any, c: any) {
                    const newState = { ...state, parent: node };
                    c(node.left, newState);
                    c(node.right, newState);
                },
                LogicalExpression(node: any, state: any, c: any) {
                    const newState = { ...state, parent: node };
                    c(node.left, newState);
                    c(node.right, newState);
                },
                UnaryExpression(node: any, state: any, c: any) {
                    const newState = { ...state, parent: node };
                    c(node.argument, newState);
                },
                CallExpression(node: any, state: any, c: any) {
                    if (!node._transformed) {
                        // First transform the call expression itself
                        transformCallExpression(node, scopeManager);
                    }
                },
                MemberExpression(node: any, state: any, c: any) {
                    transformMemberExpression(node, '', scopeManager);
                    // Then continue with object transformation
                    if (node.object) {
                        c(node.object, { parent: node });
                    }
                },
            }
        );
    });
}
