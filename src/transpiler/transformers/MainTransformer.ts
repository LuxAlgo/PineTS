// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import * as walk from 'acorn-walk';
import ScopeManager from '../analysis/ScopeManager';
import { ASTFactory } from '../utils/ASTFactory';
import { transformIdentifier, transformCallExpression, transformMemberExpression } from './ExpressionTransformer';
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
        MemberExpression(node: any, state: ScopeManager) {
            transformMemberExpression(node, originalParamName, state);
        },
        AssignmentExpression(node: any, state: ScopeManager) {
            transformAssignmentExpression(node, state);
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
