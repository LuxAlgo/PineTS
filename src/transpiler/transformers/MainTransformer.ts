// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import * as walk from 'acorn-walk';
import ScopeManager from '../analysis/ScopeManager';
import { ASTFactory } from '../utils/ASTFactory';
import { transformIdentifier, transformCallExpression, transformMemberExpression, addArrayAccess } from './ExpressionTransformer';
import {
    transformVariableDeclaration,
    transformReturnStatement,
    transformAssignmentExpression,
    transformForStatement,
    transformIfStatement,
    transformFunctionDeclaration,
} from './StatementTransformer';

export function transformEqualityChecks(ast: any): void {
    const baseVisitor = { ...walk.base, LineComment: () => {} };
    walk.simple(
        ast,
        {
            BinaryExpression(node: any) {
                // Check if this is an equality operator
                if (node.operator === '==' || node.operator === '===') {
                    // Store the original operands
                    const leftOperand = node.left;
                    const rightOperand = node.right;

                    // Transform the BinaryExpression into a CallExpression
                    const callExpr = ASTFactory.createMathEqCall(leftOperand, rightOperand);
                    callExpr._transformed = true;

                    Object.assign(node, callExpr);
                }
            },
        },
        baseVisitor
    );
}

export function runTransformationPass(
    ast: any,
    scopeManager: ScopeManager,
    originalParamName: string,
    options: { debug: boolean; ln?: boolean } = { debug: false, ln: false },
    sourceLines: string[] = []
): void {
    const createDebugComment = (originalNode: any): any => {
        if (!options.debug || !originalNode.loc || !sourceLines.length) return null;
        const lineIndex = originalNode.loc.start.line - 1;
        if (lineIndex >= 0 && lineIndex < sourceLines.length) {
            const lineText = sourceLines[lineIndex].trim();
            if (lineText) {
                const prefix = options.ln ? ` [Line ${originalNode.loc.start.line}]` : '';
                return {
                    type: 'LineComment',
                    value: `${prefix} ${lineText}`,
                };
            }
        }
        return null;
    };

    walk.recursive(ast, scopeManager, {
        Program(node: any, state: ScopeManager, c: any) {
            // state.pushScope('glb');
            const newBody: any[] = [];

            node.body.forEach((stmt: any) => {
                state.enterHoistingScope();
                c(stmt, state);
                const hoistedStmts = state.exitHoistingScope();

                const commentNode = createDebugComment(stmt);
                if (commentNode) newBody.push(commentNode);

                newBody.push(...hoistedStmts);
                newBody.push(stmt);
            });

            node.body = newBody;
            // state.popScope();
        },
        BlockStatement(node: any, state: ScopeManager, c: any) {
            // state.pushScope('block');
            const newBody: any[] = [];

            node.body.forEach((stmt: any) => {
                state.enterHoistingScope();
                c(stmt, state);
                const hoistedStmts = state.exitHoistingScope();

                const commentNode = createDebugComment(stmt);
                if (commentNode) newBody.push(commentNode);

                newBody.push(...hoistedStmts);
                newBody.push(stmt);
            });

            node.body = newBody;
            // state.popScope();
        },
        ReturnStatement(node: any, state: ScopeManager) {
            transformReturnStatement(node, state);
        },
        VariableDeclaration(node: any, state: ScopeManager) {
            transformVariableDeclaration(node, state);
        },
        Identifier(node: any, state: ScopeManager) {
            transformIdentifier(node, state);
        },
        CallExpression(node: any, state: ScopeManager, c: any) {
            // For IIFE patterns (() => { ... })(), we need to traverse the arrow function body
            if (node.callee && (node.callee.type === 'ArrowFunctionExpression' || node.callee.type === 'FunctionExpression')) {
                // Traverse the IIFE callee (the function itself)
                c(node.callee, state);
            }
            // For method call chains (a.b().c.d()), traverse the callee's object chain
            // to resolve inner identifiers and calls before processing this call
            else if (node.callee && node.callee.type === 'MemberExpression' && node.callee.object) {
                // Set parent so Identifier handler knows this is a member expression object
                // (prevents NAMESPACES_LIKE wrapping for line, label, etc.)
                node.callee.object.parent = node.callee;
                c(node.callee.object, state);
            }
            // Transform the call expression (this handles argument wrapping)
            transformCallExpression(node, state);
        },
        ArrowFunctionExpression(node: any, state: ScopeManager, c: any) {
            // Traverse the body of arrow functions
            if (node.body) {
                c(node.body, state);
            }
        },
        FunctionExpression(node: any, state: ScopeManager, c: any) {
            // Traverse the body of function expressions
            if (node.body) {
                c(node.body, state);
            }
        },
        ForOfStatement(node: any, state: ScopeManager, c: any) {
            // Mark the left (variable declaration) to skip transformation
            if (node.left && node.left.type === 'VariableDeclaration') {
                node.left._skipTransformation = true;

                // Register loop variables
                const decl = node.left.declarations[0];
                if (decl.id.type === 'Identifier') {
                    state.addLoopVariable(decl.id.name, decl.id.name);
                } else if (decl.id.type === 'ArrayPattern') {
                    decl.id.elements.forEach((elem: any) => {
                        if (elem.type === 'Identifier') {
                            state.addLoopVariable(elem.name, elem.name);
                        }
                    });
                }
            }
            // Transform the right (iterable expression) - build $.get(scopedRef, 0).array
            if (node.right && node.right.type === 'Identifier') {
                // transformIdentifier may already wrap user variables in $.get($.var.X, 0).
                // addArrayAccess reads the (stale) node.name and overwrites the result.
                // Fix: call transformIdentifier, then only call addArrayAccess if the node
                // wasn't already transformed (i.e. it's still an Identifier).
                transformIdentifier(node.right, state);
                if (node.right.type === 'Identifier') {
                    // transformIdentifier didn't rename this (context-bound / built-in var)
                    addArrayAccess(node.right, state);
                }

                // Access .array property for iteration over Pine Script arrays
                // Build: $.get(X, 0).array
                const currentRight = { ...node.right };
                
                // Create MemberExpression: currentRight.array
                let arrayAccess = ASTFactory.createMemberExpression(
                    currentRight,
                    ASTFactory.createIdentifier('array'),
                    false
                );

                // If destructuring, add .entries()
                if (node.left && node.left.type === 'VariableDeclaration' && 
                    node.left.declarations[0].id.type === 'ArrayPattern') {
                    arrayAccess = ASTFactory.createCallExpression(
                        ASTFactory.createMemberExpression(
                            arrayAccess,
                            ASTFactory.createIdentifier('entries'),
                            false
                        ),
                        []
                    );
                }
                
                // Replace node.right with the new MemberExpression/CallExpression
                Object.assign(node.right, arrayAccess);
                
            } else if (node.right) {
                c(node.right, state);
            }
            // Traverse the body
            if (node.body) {
                c(node.body, state);
            }

            // Clean up loop variables so they don't leak to outer scope
            if (node.left && node.left.type === 'VariableDeclaration') {
                const decl = node.left.declarations[0];
                if (decl.id.type === 'Identifier') {
                    state.removeLoopVariable(decl.id.name);
                } else if (decl.id.type === 'ArrayPattern') {
                    decl.id.elements.forEach((elem: any) => {
                        if (elem.type === 'Identifier') {
                            state.removeLoopVariable(elem.name);
                        }
                    });
                }
            }
        },
        ForInStatement(node: any, state: ScopeManager, c: any) {
            // Mark the left (variable declaration) to skip transformation
            if (node.left && node.left.type === 'VariableDeclaration') {
                node.left._skipTransformation = true;
            }
            // Transform the right (iterable expression) - parameters should use $.get()
            if (node.right && node.right.type === 'Identifier') {
                transformIdentifier(node.right, state);
                if (node.right.type === 'Identifier') {
                    addArrayAccess(node.right, state);
                }
            } else if (node.right) {
                c(node.right, state);
            }
            // Traverse the body
            if (node.body) {
                c(node.body, state);
            }
        },
        MemberExpression(node: any, state: ScopeManager, c: any) {
            // Traverse the object for nested call/member chains (e.g. a.get(i).out)
            // to resolve inner identifiers before transforming this member expression
            if (node.object && (node.object.type === 'CallExpression' || node.object.type === 'MemberExpression')) {
                node.object.parent = node;
                c(node.object, state);
            }
            // Also recurse into Identifier objects so user-defined variables (like enums)
            // get properly renamed inside function bodies.
            // Context-bound identifiers (namespaces like color, ta) are safe — the Identifier
            // handler returns early for them, preserving the existing namespace handling below.
            if (node.object && node.object.type === 'Identifier' && !state.isContextBound(node.object.name)) {
                node.object.parent = node;
                c(node.object, state);
            }
            transformMemberExpression(node, originalParamName, state);
        },
        AssignmentExpression(node: any, state: ScopeManager, c: any) {
            transformAssignmentExpression(node, state);
            // After compound assignment transformation, the node becomes $.set(target, rhs).
            // Traverse any IIFEs in the RHS to transform identifiers inside them
            // (e.g., switch-expression IIFEs in compound assignments like disp /= switch i {...}).
            if (node.type === 'CallExpression' && node.arguments) {
                const traverseForIIFEs = (n: any): void => {
                    if (!n) return;
                    if (n.type === 'CallExpression' && n.callee &&
                        (n.callee.type === 'ArrowFunctionExpression' || n.callee.type === 'FunctionExpression')) {
                        c(n.callee, state);
                    }
                    if (n.type === 'BinaryExpression') {
                        traverseForIIFEs(n.left);
                        traverseForIIFEs(n.right);
                    }
                };
                node.arguments.forEach((arg: any) => traverseForIIFEs(arg));
            }
        },
        FunctionDeclaration(node: any, state: ScopeManager, c: any) {
            transformFunctionDeclaration(node, state, c);
        },
        ForStatement(node: any, state: ScopeManager, c: any) {
            transformForStatement(node, state, c);
        },
        IfStatement(node: any, state: ScopeManager, c: any) {
            transformIfStatement(node, state, c);
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
                // stmt.parent = node; // Not strictly necessary for statements, but good for consistency
                c(stmt, state);
                const hoistedStmts = state.exitHoistingScope();
                newConsequent.push(...hoistedStmts);
                newConsequent.push(stmt);
            });
            node.consequent = newConsequent;
        },
        AwaitExpression(node: any, state: ScopeManager, c: any) {
            // Mark the argument as being inside an await so transformCallExpression knows not to add another await
            if (node.argument) {
                node.argument._insideAwait = true;

                // First, transform the argument
                c(node.argument, state);

                // After transformation, if the argument was hoisted and replaced with an identifier,
                // remove the await since the hoisted statement already has it
                if (node.argument.type === 'Identifier') {
                    // Check if this identifier came from hoisting an awaited call
                    const isHoistedAwaitedCall = node.argument._wasInsideAwait === true;
                    if (isHoistedAwaitedCall) {
                        // Replace the AwaitExpression with just the identifier
                        node.type = 'Identifier';
                        node.name = node.argument.name;
                        // Copy over any other properties
                        if (node.argument._wasHoisted) node._wasHoisted = node.argument._wasHoisted;
                        // Clean up the await-specific properties
                        delete node.argument;
                    }
                }
            }
        },
    });
}
