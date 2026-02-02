// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import * as walk from 'acorn-walk';
import ScopeManager from '../analysis/ScopeManager';
import { ASTFactory, CONTEXT_NAME } from '../utils/ASTFactory';
import {
    transformIdentifier,
    transformCallExpression,
    transformMemberExpression,
    transformArrayIndex,
    addArrayAccess,
    createScopedVariableReference,
    createScopedVariableAccess,
} from './ExpressionTransformer';

export function transformAssignmentExpression(node: any, scopeManager: ScopeManager): void {
    let targetVarRef = null;
    // Transform assignment expressions to use the context object
    if (node.left.type === 'Identifier') {
        targetVarRef = createScopedVariableReference(node.left.name, scopeManager);
    } else if (node.left.type === 'MemberExpression' && node.left.computed) {
        // Assignment to array element: series[0] = val
        if (node.left.object.type === 'Identifier') {
            const name = node.left.object.name;
            const [varName, kind] = scopeManager.getVariable(name);
            const isRenamed = varName !== name;
            const isContextBound = scopeManager.isContextBound(name);

            if ((isRenamed || isContextBound) && !scopeManager.isLoopVariable(name)) {
                // If index is 0 (literal), transform to $.set(target, value)
                if (node.left.property.type === 'Literal' && node.left.property.value === 0) {
                    targetVarRef = createScopedVariableReference(name, scopeManager);
                }
            }
        }
    } else if (node.left.type === 'MemberExpression' && !node.left.computed) {
        // Assignment to object property: obj.property = val
        // Transform the object identifier if it's a user variable
        if (node.left.object.type === 'Identifier') {
            const name = node.left.object.name;
            const [varName, kind] = scopeManager.getVariable(name);
            const isRenamed = varName !== name;

            // Only transform if the variable has been renamed (i.e., it's a user-defined variable)
            // Context-bound variables that are NOT renamed (like 'display', 'ta', 'input') should NOT be transformed
            if (isRenamed && !scopeManager.isLoopVariable(name)) {
                // Transform object to scoped variable reference with [0] access
                // trade2.active = false  ->  $.get($.let.glb1_trade2, 0).active = false
                const contextVarRef = createScopedVariableReference(name, scopeManager);
                const getCall = ASTFactory.createGetCall(contextVarRef, 0);
                node.left.object = getCall;
            }
        }
    }

    // Transform identifiers in the right side of the assignment
    walk.recursive(
        node.right,
        { parent: node.right, inNamespaceCall: false },
        {
            Identifier(node: any, state: any, c: any) {
                //special case for na
                if (node.name == 'na') {
                    node.name = 'NaN';
                }
                node.parent = state.parent;
                transformIdentifier(node, scopeManager);
                const isBinaryOperation = node.parent && node.parent.type === 'BinaryExpression';
                const isConditional = node.parent && node.parent.type === 'ConditionalExpression';
                const isContextBound = scopeManager.isContextBound(node.name) && !scopeManager.isRootParam(node.name);
                const hasArrayAccess = node.parent && node.parent.type === 'MemberExpression' && node.parent.computed && node.parent.object === node;
                const isParamCall = node.parent && node.parent._isParamCall;
                const isMemberExpression = node.parent && node.parent.type === 'MemberExpression';
                const isReserved = node.name === 'NaN';
                const isGetCall =
                    node.parent &&
                    node.parent.type === 'CallExpression' &&
                    node.parent.callee &&
                    node.parent.callee.object &&
                    node.parent.callee.object.name === CONTEXT_NAME &&
                    node.parent.callee.property.name === 'get';

                if (isContextBound || isConditional || isBinaryOperation) {
                    if (node.type === 'MemberExpression') {
                        transformArrayIndex(node, scopeManager);
                    } else if (node.type === 'Identifier' && !isMemberExpression && !hasArrayAccess && !isParamCall && !isReserved && !isGetCall) {
                        addArrayAccess(node, scopeManager);
                    }
                }
            },
            MemberExpression(node: any, state: any, c: any) {
                transformMemberExpression(node, '', scopeManager);
                // Then continue with object transformation or arguments if transformed to CallExpression
                if (node.type === 'CallExpression') {
                    node.arguments.forEach((arg: any) => c(arg, { parent: node, inNamespaceCall: state.inNamespaceCall }));
                } else if (node.object) {
                    c(node.object, { parent: node, inNamespaceCall: state.inNamespaceCall });
                }
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

                if (node.type !== 'CallExpression') return;

                // Then transform its arguments with the correct context
                node.arguments.forEach((arg: any) => c(arg, { parent: node, inNamespaceCall: isNamespaceCall || state.inNamespaceCall }));
            },
        }
    );

    if (targetVarRef) {
        let rightSide = node.right;

        // Handle compound assignment operators (+=, -=, *=, etc.)
        if (node.operator !== '=') {
            const operator = node.operator.replace('=', '');

            // Create a read access for the target variable: $.get(targetVarRef, 0)
            const readAccess = ASTFactory.createGetCall(targetVarRef, 0);

            // Create a binary expression: readAccess [op] node.right
            // Example: a += 10  ->  $.set(a, $.get(a, 0) + 10)
            rightSide = {
                type: 'BinaryExpression',
                operator: operator,
                left: readAccess,
                right: node.right,
                start: node.start,
                end: node.end,
            };
        }

        // Replace the whole assignment expression with $.set(targetVarRef, rightSide)
        const setCall = ASTFactory.createSetCall(targetVarRef, rightSide);

        // Preserve location
        if (node.start) setCall.start = node.start;
        if (node.end) setCall.end = node.end;

        Object.assign(node, setCall);
    }
}

export function transformVariableDeclaration(varNode: any, scopeManager: ScopeManager): void {
    if (varNode._skipTransformation) return;

    varNode.declarations.forEach((decl: any) => {
        //special case for na
        if (decl.init.name == 'na') {
            decl.init.name = 'NaN';
        }

        // Check if this is a context property assignment

        // prettier-ignore
        const isContextProperty =
            decl.init &&
            decl.init.type === 'MemberExpression' &&
            decl.init.object &&            
                (decl.init.object.name === 'context' || 
                    decl.init.object.name === CONTEXT_NAME || 
                    decl.init.object.name === 'context2')

        // prettier-ignore
        const isSubContextProperty =
            decl.init &&
            decl.init.type === 'MemberExpression' &&
            decl.init.object?.object &&
            (decl.init.object.object.name === 'context' ||
                decl.init.object.object.name === CONTEXT_NAME ||
                decl.init.object.object.name === 'context2');

        // Check if this is an arrow function declaration
        const isArrowFunction = decl.init && decl.init.type === 'ArrowFunctionExpression';

        if (isContextProperty) {
            // For context properties, register as context-bound and update the object name
            if (decl.id.name) {
                scopeManager.addContextBoundVar(decl.id.name);
            }
            if (decl.id.properties) {
                decl.id.properties.forEach((property: any) => {
                    if (property.key.name) {
                        scopeManager.addContextBoundVar(property.key.name);
                    }
                });
            }
            decl.init.object.name = CONTEXT_NAME;
            return;
        }

        if (isSubContextProperty) {
            // For context properties, register as context-bound and update the object name
            if (decl.id.name) {
                scopeManager.addContextBoundVar(decl.id.name);
            }
            if (decl.id.properties) {
                decl.id.properties.forEach((property: any) => {
                    if (property.key.name) {
                        scopeManager.addContextBoundVar(property.key.name);
                    }
                });
            }
            decl.init.object.object.name = CONTEXT_NAME;
            return;
        }

        // Note: Arrow function parameters are already registered in AnalysisPass
        // No need to register them again here

        // Transform non-context variables to use the context object
        const newName = scopeManager.addVariable(decl.id.name, varNode.kind);
        const kind = varNode.kind; // 'const', 'let', or 'var'

        const isArrayPatternVar = scopeManager.isArrayPatternElement(decl.id.name);

        // Transform identifiers in the init expression
        if (decl.init && !isArrowFunction && !isArrayPatternVar) {
            // Check if initialization is a namespace function call
            if (
                decl.init.type === 'CallExpression' &&
                decl.init.callee.type === 'MemberExpression' &&
                decl.init.callee.object &&
                decl.init.callee.object.type === 'Identifier' &&
                scopeManager.isContextBound(decl.init.callee.object.name)
            ) {
                // Transform the function call arguments
                transformCallExpression(decl.init, scopeManager);
            } else {
                // Add parent references for proper function call detection
                walk.recursive(
                    decl.init,
                    { parent: decl.init },
                    {
                        Identifier(node: any, state: any) {
                            node.parent = state.parent;
                            transformIdentifier(node, scopeManager);

                            const isBinaryOperation = node.parent && node.parent.type === 'BinaryExpression';
                            const isUnaryOperation = node.parent && node.parent.type === 'UnaryExpression';
                            const isConditional = node.parent && node.parent.type === 'ConditionalExpression';
                            const isGetCall =
                                node.parent &&
                                node.parent.type === 'CallExpression' &&
                                node.parent.callee &&
                                node.parent.callee.object &&
                                node.parent.callee.object.name === CONTEXT_NAME &&
                                node.parent.callee.property.name === 'get';

                            if (node.type === 'Identifier' && (isBinaryOperation || isUnaryOperation || isConditional) && !isGetCall) {
                                addArrayAccess(node, scopeManager);
                            }
                        },
                        CallExpression(node: any, state: any, c: any) {
                            // Set parent for the function name
                            if (node.callee.type === 'Identifier') {
                                node.callee.parent = node;
                            }
                            // Set parent for arguments
                            node.arguments.forEach((arg: any) => {
                                if (arg.type === 'Identifier') {
                                    arg.parent = node;
                                }
                            });

                            // If the callee is an IIFE (ArrowFunctionExpression or FunctionExpression), traverse it
                            if (node.callee.type === 'ArrowFunctionExpression' || node.callee.type === 'FunctionExpression') {
                                c(node.callee, { parent: node });
                            }

                            transformCallExpression(node, scopeManager);

                            if (node.type !== 'CallExpression') return;

                            // Continue walking the arguments
                            node.arguments.forEach((arg) => c(arg, { parent: node }));
                        },
                        BinaryExpression(node: any, state: any, c: any) {
                            // Set parent references for operands
                            if (node.left.type === 'Identifier') {
                                node.left.parent = node;
                            }
                            if (node.right.type === 'Identifier') {
                                node.right.parent = node;
                            }
                            // Transform both operands
                            c(node.left, { parent: node });
                            c(node.right, { parent: node });
                        },
                        MemberExpression(node: any, state: any, c: any) {
                            // Set parent reference
                            if (node.object && node.object.type === 'Identifier') {
                                node.object.parent = node;
                            }
                            if (node.property && node.property.type === 'Identifier') {
                                node.property.parent = node;
                            }
                            // Transform array indices first
                            transformMemberExpression(node, '', scopeManager);
                            // Then continue with object transformation
                            if (node.type === 'CallExpression') {
                                node.arguments.forEach((arg: any) => c(arg, { parent: node }));
                            } else if (node.object) {
                                c(node.object, { parent: node });
                            }
                        },
                        AwaitExpression(node: any, state: any, c: any) {
                            // Mark the argument as being inside an await
                            if (node.argument) {
                                node.argument._insideAwait = true;

                                // Transform the argument
                                c(node.argument, { parent: node });

                                // After transformation, if the argument was hoisted and is now an identifier,
                                // remove the await since it's already in the hoisted statement
                                if (node.argument.type === 'Identifier' && node.argument._wasInsideAwait) {
                                    // Replace the AwaitExpression with just the identifier
                                    Object.assign(node, node.argument);
                                }
                            }
                        },
                        ArrowFunctionExpression(node: any, state: any, c: any) {
                            // For IIFE arrow functions, manage hoisting like BlockStatement does
                            // This prevents hoisted statements from escaping to the outer scope
                            if (node.body) {
                                if (node.body.type === 'BlockStatement') {
                                    // Process each statement with its own hoisting scope
                                    const newBody: any[] = [];
                                    node.body.body.forEach((stmt: any) => {
                                        scopeManager.enterHoistingScope();
                                        c(stmt, { parent: node.body });
                                        const hoistedStmts = scopeManager.exitHoistingScope();
                                        newBody.push(...hoistedStmts);
                                        newBody.push(stmt);
                                    });
                                    node.body.body = newBody;
                                } else {
                                    // For expression body, traverse the expression
                                    c(node.body, { parent: node });
                                }
                            }
                        },
                        FunctionExpression(node: any, state: any, c: any) {
                            // For IIFE function expressions, manage hoisting like BlockStatement does
                            if (node.body && node.body.type === 'BlockStatement') {
                                const newBody: any[] = [];
                                node.body.body.forEach((stmt: any) => {
                                    scopeManager.enterHoistingScope();
                                    c(stmt, { parent: node.body });
                                    const hoistedStmts = scopeManager.exitHoistingScope();
                                    newBody.push(...hoistedStmts);
                                    newBody.push(stmt);
                                });
                                node.body.body = newBody;
                            }
                        },
                        SwitchStatement(node: any, state: any, c: any) {
                            // Traverse discriminant and all cases
                            if (node.discriminant) {
                                node.discriminant.parent = node;
                                c(node.discriminant, { parent: node });
                            }
                            if (node.cases) {
                                node.cases.forEach((caseNode: any) => {
                                    caseNode.parent = node;
                                    c(caseNode, { parent: node });
                                });
                            }
                        },
                        SwitchCase(node: any, state: any, c: any) {
                            // Traverse test (the case value)
                            if (node.test) {
                                node.test.parent = node;
                                c(node.test, { parent: node });
                            }
                            // Traverse all consequent statements with hoisting management
                            if (node.consequent) {
                                const newConsequent: any[] = [];
                                node.consequent.forEach((stmt: any) => {
                                    scopeManager.enterHoistingScope();
                                    stmt.parent = node;
                                    c(stmt, { parent: node });
                                    const hoistedStmts = scopeManager.exitHoistingScope();
                                    newConsequent.push(...hoistedStmts);
                                    newConsequent.push(stmt);
                                });
                                node.consequent = newConsequent;
                            }
                        },
                    }
                );
            }
        }

        // Create the target variable reference using ASTFactory
        const targetVarRef = createScopedVariableReference(decl.id.name, scopeManager);

        // Check if initialization is from array access
        const isArrayInit =
            !isArrayPatternVar &&
            decl.init &&
            decl.init.type === 'MemberExpression' &&
            decl.init.computed &&
            decl.init.property &&
            (decl.init.property.type === 'Literal' || decl.init.property.type === 'MemberExpression');

        if (decl.init?.property?.type === 'MemberExpression') {
            if (!decl.init.property._indexTransformed) {
                transformArrayIndex(decl.init.property, scopeManager);
                decl.init.property._indexTransformed = true;
            }
        }

        // Prepare right side
        let rightSide;
        if (decl.init) {
            if (isArrowFunction || isArrayPatternVar) {
                rightSide = decl.init;
            } else if (kind === 'var') {
                rightSide = ASTFactory.createInitVarCall(targetVarRef, decl.init);
            } else {
                rightSide = ASTFactory.createInitCall(
                    targetVarRef,
                    isArrayInit ? decl.init.object : decl.init,
                    isArrayInit ? decl.init.property : undefined
                );
            }
        } else {
            rightSide = ASTFactory.createIdentifier('undefined');
        }

        // Create assignment
        const assignmentExpr = ASTFactory.createExpressionStatement(ASTFactory.createAssignmentExpression(targetVarRef, rightSide));

        if (isArrayPatternVar) {
            // For array pattern destructuring, we need to:
            // 1. Use $.get(tempVar, 0) to get the current value from the Series
            // 2. Then access the array element [index]

            // We skipped transformation for decl.init, so it's still a MemberExpression (temp[index])
            const tempVarName = decl.init.object.name;
            const tempVarRef = createScopedVariableReference(tempVarName, scopeManager);
            const arrayIndex = decl.init.property.value;

            // Create $.get(tempVar, 0)[index]
            const getCall = ASTFactory.createGetCall(tempVarRef, 0);
            const arrayAccess = {
                type: 'MemberExpression',
                object: getCall,
                property: {
                    type: 'Literal',
                    value: arrayIndex,
                },
                computed: true,
            };

            // Wrap in $.init(targetVar, $.get(tempVar, 0)[index])
            assignmentExpr.expression.right = ASTFactory.createCallExpression(
                ASTFactory.createMemberExpression(ASTFactory.createContextIdentifier(), ASTFactory.createIdentifier('init')),
                [targetVarRef, arrayAccess]
            );
        }

        if (isArrowFunction) {
            // Transform the body of arrow functions
            scopeManager.pushScope('fn');
            walk.recursive(decl.init.body, scopeManager, {
                IfStatement(node: any, state: ScopeManager, c: any) {
                    state.pushScope('if');
                    c(node.consequent, state);
                    if (node.alternate) {
                        state.pushScope('els');
                        c(node.alternate, state);
                        state.popScope();
                    }
                    state.popScope();
                },
                VariableDeclaration(node: any, state: ScopeManager) {
                    transformVariableDeclaration(node, state);
                },
                Identifier(node: any, state: ScopeManager) {
                    transformIdentifier(node, state);
                },
                AssignmentExpression(node: any, state: ScopeManager) {
                    transformAssignmentExpression(node, state);
                },
                SwitchStatement(node: any, state: ScopeManager, c: any) {
                    node.discriminant.parent = node;
                    c(node.discriminant, state);
                    node.cases.forEach((caseNode: any) => {
                        caseNode.parent = node;
                        c(caseNode, state);
                    });
                },
                SwitchCase(node: any, state: ScopeManager, c: any) {
                    if (node.test) {
                        node.test.parent = node;
                        c(node.test, state);
                    }
                    const newConsequent: any[] = [];
                    node.consequent.forEach((stmt: any) => {
                        state.enterHoistingScope();
                        c(stmt, state);
                        const hoistedStmts = state.exitHoistingScope();
                        newConsequent.push(...hoistedStmts);
                        newConsequent.push(stmt);
                    });
                    node.consequent = newConsequent;
                },
                BlockStatement(node: any, state: ScopeManager, c: any) {
                    const newBody: any[] = [];
                    node.body.forEach((stmt: any) => {
                        state.enterHoistingScope();
                        c(stmt, state);
                        const hoistedStmts = state.exitHoistingScope();
                        newBody.push(...hoistedStmts);
                        newBody.push(stmt);
                    });
                    node.body = newBody;
                },
            });
            scopeManager.popScope();
        }

        // Replace the original node with the transformed assignment
        Object.assign(varNode, assignmentExpr);
    });
}

export function transformForStatement(node: any, scopeManager: ScopeManager, c: any): void {
    scopeManager.setSuppressHoisting(true);
    // Handle initialization
    if (node.init && node.init.type === 'VariableDeclaration') {
        // Keep the original loop variable name
        const decl = node.init.declarations[0];
        const originalName = decl.id.name;
        scopeManager.addLoopVariable(originalName, originalName);

        // Keep the original variable declaration
        node.init = {
            type: 'VariableDeclaration',
            kind: node.init.kind,
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'Identifier',
                        name: originalName,
                    },
                    init: decl.init,
                },
            ],
        };

        // Transform any identifiers in the init expression
        if (decl.init) {
            walk.recursive(decl.init, scopeManager, {
                Identifier(node: any, state: ScopeManager) {
                    if (!scopeManager.isLoopVariable(node.name)) {
                        scopeManager.pushScope('for');
                        transformIdentifier(node, state);
                        scopeManager.popScope();
                    }
                },
                MemberExpression(node: any) {
                    scopeManager.pushScope('for');
                    transformMemberExpression(node, '', scopeManager);
                    scopeManager.popScope();
                },
            });
        }
    }

    // Transform test condition
    if (node.test) {
        walk.recursive(node.test, scopeManager, {
            Identifier(node: any, state: ScopeManager) {
                if (!scopeManager.isLoopVariable(node.name) && !node.computed) {
                    scopeManager.pushScope('for');
                    transformIdentifier(node, state);
                    if (node.type === 'Identifier') {
                        node.computed = true;
                        addArrayAccess(node, state);
                    }
                    scopeManager.popScope();
                }
            },
            MemberExpression(node: any) {
                scopeManager.pushScope('for');
                transformMemberExpression(node, '', scopeManager);
                scopeManager.popScope();
            },
        });
    }

    // Transform update expression
    if (node.update) {
        walk.recursive(node.update, scopeManager, {
            Identifier(node: any, state: ScopeManager) {
                if (!scopeManager.isLoopVariable(node.name)) {
                    scopeManager.pushScope('for');
                    transformIdentifier(node, state);
                    scopeManager.popScope();
                }
            },
        });
    }

    // Transform the loop body
    scopeManager.setSuppressHoisting(false);
    scopeManager.pushScope('for');
    c(node.body, scopeManager);
    scopeManager.popScope();
}

export function transformWhileStatement(node: any, scopeManager: ScopeManager, c: any): void {
    scopeManager.setSuppressHoisting(true);
    // Transform the test condition of the while loop
    walk.simple(node.test, {
        Identifier(idNode: any) {
            transformIdentifier(idNode, scopeManager);
        },
    });
    scopeManager.setSuppressHoisting(false);

    // Process the body of the while loop
    scopeManager.pushScope('whl');
    c(node.body, scopeManager);
    scopeManager.popScope();
}

export function transformExpression(node: any, scopeManager: ScopeManager): void {
    walk.recursive(node, scopeManager, {
        MemberExpression(node: any) {
            transformMemberExpression(node, '', scopeManager);
        },

        CallExpression(node: any, state: ScopeManager) {
            transformCallExpression(node, state);
        },
        Identifier(node: any, state: ScopeManager) {
            transformIdentifier(node, state);

            //context bound variable was not transformed, but we still need to ensure array annotation
            const isIfStatement = scopeManager.getCurrentScopeType() === 'if';
            const isContextBound = scopeManager.isContextBound(node.name) && !scopeManager.isRootParam(node.name);
            if (isContextBound && isIfStatement) {
                addArrayAccess(node, state);
            }
        },
    });
}

export function transformIfStatement(node: any, scopeManager: ScopeManager, c: any): void {
    // Transform the test condition
    if (node.test) {
        scopeManager.pushScope('if');
        transformExpression(node.test, scopeManager);
        scopeManager.popScope();
    }

    // Transform the if branch (consequent)
    scopeManager.pushScope('if');
    c(node.consequent, scopeManager);
    scopeManager.popScope();

    // Transform the else branch (alternate) if it exists
    if (node.alternate) {
        scopeManager.pushScope('els');
        c(node.alternate, scopeManager);
        scopeManager.popScope();
    }
}

export function transformReturnStatement(node: any, scopeManager: ScopeManager): void {
    const curScope = scopeManager.getCurrentScopeType();
    // Transform the return argument if it exists
    if (node.argument) {
        if (node.argument.type === 'ArrayExpression') {
            // Transform each element in the array
            node.argument.elements = node.argument.elements.map((element: any) => {
                if (element.type === 'Identifier') {
                    // Skip transformation if it's a context-bound variable
                    if (scopeManager.isContextBound(element.name) && !scopeManager.isRootParam(element.name)) {
                        // Use $.get(element, 0) instead of element[0] for context-bound variables
                        return ASTFactory.createGetCall(element, 0);
                    }

                    // Transform non-context-bound variables
                    return createScopedVariableAccess(element.name, scopeManager);
                } else if (element.type === 'MemberExpression') {
                    // Check if this is a context variable reference ($.const.xxx, $.let.xxx, etc.)
                    const isContextVarRef =
                        element.object &&
                        element.object.type === 'MemberExpression' &&
                        element.object.object &&
                        element.object.object.type === 'Identifier' &&
                        element.object.object.name === '$' &&
                        element.object.property &&
                        ['const', 'let', 'var', 'params'].includes(element.object.property.name);

                    if (isContextVarRef) {
                        // Use $.get($.const.xxx, 0) instead of $.const.xxx[0]
                        return ASTFactory.createGetCall(element, 0);
                    }

                    // If it's already a member expression (array access), leave it as is
                    if (
                        element.computed &&
                        element.object.type === 'Identifier' &&
                        scopeManager.isContextBound(element.object.name) &&
                        !scopeManager.isRootParam(element.object.name)
                    ) {
                        return element;
                    }
                    // Otherwise, transform it normally
                    transformMemberExpression(element, '', scopeManager);
                    return element;
                }
                return element;
            });

            node.argument = {
                type: 'ArrayExpression',
                elements: [node.argument],
            };
        } else if (node.argument.type === 'ObjectExpression') {
            // Handle object expressions
            node.argument.properties = node.argument.properties.map((prop: any) => {
                // Check for shorthand properties
                if (prop.shorthand) {
                    // Check if it's a context-bound variable first
                    if (scopeManager.isContextBound(prop.value.name)) {
                        return prop;
                    }

                    // Get the variable name and kind
                    const [scopedName, kind] = scopeManager.getVariable(prop.value.name);

                    // Convert shorthand to full property definition
                    return {
                        type: 'Property',
                        key: ASTFactory.createIdentifier(prop.key.name),
                        value: createScopedVariableReference(prop.value.name, scopeManager),
                        kind: 'init',
                        method: false,
                        shorthand: false,
                        computed: false,
                    };
                }

                // Handle regular properties with identifier values
                if (prop.value && prop.value.type === 'Identifier') {
                    // Check if it's a context-bound variable (like 'close', 'open', etc.)
                    if (scopeManager.isContextBound(prop.value.name) && !scopeManager.isRootParam(prop.value.name)) {
                        // It's a data variable - use $.get(variable, 0)
                        // prop.value = ASTFactory.createGetCall(prop.value, 0);
                        // FIXED: Keep native data as Series (don't dereference to value)
                    } else if (!scopeManager.isContextBound(prop.value.name)) {
                        // It's a user variable - transform to context reference
                        prop.value = createScopedVariableReference(prop.value.name, scopeManager);
                    }
                }

                return prop;
            });
        } else if (node.argument.type === 'Identifier') {
            transformIdentifier(node.argument, scopeManager);
            if (node.argument.type === 'Identifier') {
                addArrayAccess(node.argument, scopeManager);
            }
        }

        if (curScope === 'fn') {
            //for nested functions : wrap the return argument in a CallExpression with math._precision(<statement>)
            // Process different types of return arguments
            if (
                node.argument.type === 'Identifier' &&
                scopeManager.isContextBound(node.argument.name) &&
                !scopeManager.isRootParam(node.argument.name)
            ) {
                // For context-bound identifiers, add [0] array access if not already an array access
                node.argument = ASTFactory.createArrayAccess(node.argument, 0);
            } else if (node.argument.type === 'MemberExpression') {
                // For member expressions, check if the object is context-bound
                if (
                    node.argument.object.type === 'Identifier' &&
                    scopeManager.isContextBound(node.argument.object.name) &&
                    !scopeManager.isRootParam(node.argument.object.name)
                ) {
                    // Transform array indices first if not already transformed
                    if (!node.argument._indexTransformed) {
                        transformArrayIndex(node.argument, scopeManager);
                        node.argument._indexTransformed = true;
                    }
                }
            } else if (
                node.argument.type === 'BinaryExpression' ||
                node.argument.type === 'LogicalExpression' ||
                node.argument.type === 'ConditionalExpression' ||
                node.argument.type === 'CallExpression'
            ) {
                // For complex expressions, walk the AST and transform all identifiers and expressions
                walk.recursive(node.argument, scopeManager, {
                    Identifier(node: any, state: ScopeManager) {
                        transformIdentifier(node, state);
                        // Add array access if needed
                        if (node.type === 'Identifier' && !node._arrayAccessed) {
                            addArrayAccess(node, state);
                            node._arrayAccessed = true;
                        }
                    },
                    MemberExpression(node: any) {
                        transformMemberExpression(node, '', scopeManager);
                    },
                    // c is the callback function for recursion (acorn-walk)
                    CallExpression(node: any, state: ScopeManager, c: any) {
                        if (node.callee.type === 'ArrowFunctionExpression' || node.callee.type === 'FunctionExpression') {
                            c(node.callee, state);
                        }
                        transformCallExpression(node, state);
                        if (node.type === 'CallExpression') {
                            node.arguments.forEach((arg: any) => c(arg, state));
                        }
                    },
                    BinaryExpression(node: any, state: any, c: any) {
                        c(node.left, state);
                        c(node.right, state);
                    },
                    ArrowFunctionExpression(node: any, state: any, c: any) {
                        // For IIFE arrow functions, manage hoisting like BlockStatement does
                        if (node.body) {
                            if (node.body.type === 'BlockStatement') {
                                const newBody: any[] = [];
                                node.body.body.forEach((stmt: any) => {
                                    scopeManager.enterHoistingScope();
                                    c(stmt, state);
                                    const hoistedStmts = scopeManager.exitHoistingScope();
                                    newBody.push(...hoistedStmts);
                                    newBody.push(stmt);
                                });
                                node.body.body = newBody;
                            } else {
                                c(node.body, state);
                            }
                        }
                    },
                    FunctionExpression(node: any, state: any, c: any) {
                        // For IIFE function expressions, manage hoisting like BlockStatement does
                        if (node.body && node.body.type === 'BlockStatement') {
                            const newBody: any[] = [];
                            node.body.body.forEach((stmt: any) => {
                                scopeManager.enterHoistingScope();
                                c(stmt, state);
                                const hoistedStmts = scopeManager.exitHoistingScope();
                                newBody.push(...hoistedStmts);
                                newBody.push(stmt);
                            });
                            node.body.body = newBody;
                        }
                    },
                    SwitchStatement(node: any, state: ScopeManager, c: any) {
                        node.discriminant.parent = node;
                        c(node.discriminant, state);
                        node.cases.forEach((caseNode: any) => {
                            caseNode.parent = node;
                            c(caseNode, state);
                        });
                    },
                    SwitchCase(node: any, state: any, c: any) {
                        if (node.test) {
                            node.test.parent = node;
                            c(node.test, state);
                        }
                        const newConsequent: any[] = [];
                        node.consequent.forEach((stmt: any) => {
                            scopeManager.enterHoistingScope();
                            c(stmt, state);
                            const hoistedStmts = scopeManager.exitHoistingScope();
                            newConsequent.push(...hoistedStmts);
                            newConsequent.push(stmt);
                        });
                        node.consequent = newConsequent;
                    },
                    BlockStatement(node: any, state: ScopeManager, c: any) {
                        const newBody: any[] = [];
                        node.body.forEach((stmt: any) => {
                            state.enterHoistingScope();
                            c(stmt, state);
                            const hoistedStmts = state.exitHoistingScope();
                            newBody.push(...hoistedStmts);
                            newBody.push(stmt);
                        });
                        node.body = newBody;
                    },
                });
            }

            const precisionCall = ASTFactory.createCallExpression(
                ASTFactory.createMemberExpression(ASTFactory.createContextIdentifier(), ASTFactory.createIdentifier('precision')),
                [node.argument]
            );
            node.argument = precisionCall;
        }
    }
}

export function transformFunctionDeclaration(node: any, scopeManager: ScopeManager, c: any): void {
    // Note: We don't register parameters here anymore, that's done in the AnalysisPass.

    // Inject callId parameter for user-defined functions to allow unique state per call
    // CHANGED: Instead of adding a parameter, we inject a variable declaration at the start of the function body
    // which retrieves the current callId from the context stack.
    // node.params.push(ASTFactory.createIdentifier('_callId'));

    const callIdDecl = ASTFactory.createVariableDeclaration(
        '$$',
        ASTFactory.createCallExpression(
            ASTFactory.createMemberExpression(ASTFactory.createContextIdentifier(), ASTFactory.createIdentifier('peekCtx')),
            []
        )
    );
    // Mark as special to skip transformation and be treated as raw variable
    callIdDecl._skipTransformation = true;
    scopeManager.addLoopVariable('$$', '$$');

    // Transform the function body
    if (node.body && node.body.type === 'BlockStatement') {
        // Inject the _callId declaration at the start of the body
        node.body.body.unshift(callIdDecl);

        scopeManager.pushScope('fn');
        
        // Register function parameters in the function scope
        // They should be context-bound within this scope only
        node.params.forEach((param: any) => {
            if (param.type === 'Identifier') {
                scopeManager.addContextBoundVar(param.name, false);
            }
        });
        
        // Just delegate to the callback to continue the recursion
        c(node.body, scopeManager);
        
        // Clean up: remove parameters from context-bound after exiting function scope
        node.params.forEach((param: any) => {
            if (param.type === 'Identifier') {
                scopeManager.removeContextBoundVar(param.name);
            }
        });
        
        scopeManager.popScope();
    }
}
