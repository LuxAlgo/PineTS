// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import * as walk from 'acorn-walk';
import { ASTFactory, CONTEXT_NAME } from '../utils/ASTFactory';
import { CONTEXT_DATA_VARS, CONTEXT_PINE_VARS } from '../settings';

/**
 * Injects implicit imports for missing context variables (data and pine namespaces)
 * This ensures that users don't have to manually destructure context.data or context.pine
 * @param ast The AST to transform
 */
export function injectImplicitImports(ast: any): void {
    // 1. Identify the main function body
    let mainBody: any[] | null = null;
    let contextParamName = CONTEXT_NAME; // Default to '$' or 'context'

    // We expect the AST to be a Program containing an ExpressionStatement which is the ArrowFunction
    // e.g. (context) => { ... }
    if (ast.type === 'Program' && ast.body.length > 0) {
        const firstStmt = ast.body[0];
        if (
            firstStmt.type === 'ExpressionStatement' &&
            (firstStmt.expression.type === 'ArrowFunctionExpression' || firstStmt.expression.type === 'FunctionExpression')
        ) {
            const fn = firstStmt.expression;
            if (fn.body.type === 'BlockStatement') {
                mainBody = fn.body.body;
                // Get the parameter name used for context
                if (fn.params.length > 0 && fn.params[0].type === 'Identifier') {
                    contextParamName = fn.params[0].name;
                }
            }
        }
    }

    if (!mainBody) return;

    // 2. Scan for declared variables and used identifiers
    const declaredVars = new Set<string>();
    const usedIdentifiers = new Set<string>();

    // Helper to add declared variables
    const addDeclared = (pattern: any) => {
        if (pattern.type === 'Identifier') {
            declaredVars.add(pattern.name);
        } else if (pattern.type === 'ObjectPattern') {
            pattern.properties.forEach((p: any) => addDeclared(p.value));
        } else if (pattern.type === 'ArrayPattern') {
            pattern.elements.forEach((e: any) => {
                if (e) addDeclared(e);
            });
        }
    };

    // Walk the main body to find declarations and usages
    // We only care about the top-level scope of the main function for injections
    // But usages can be nested.

    // Note: We need to be careful not to count property access as usage (e.g. obj.prop)
    // unless it is computed.

    walk.recursive(
        ast,
        {},
        {
            VariableDeclarator(node: any, state: any, c: any) {
                addDeclared(node.id);
                if (node.init) c(node.init, state);
            },
            FunctionDeclaration(node: any, state: any, c: any) {
                addDeclared(node.id);
                // Params are declarations in the function scope, but here we care about top level?
                // If user defines function foo(open) { ... }, 'open' is shadowed.
                // We should still inject 'open' if it's used in the global scope.
                // So we just track global declarations.
                // But walk.recursive goes deep.
                // Actually, we only need to know if the variable is declared in the TOP LEVEL scope.
                // Nested declarations shadow global ones, so that's fine.
                // If we inject `const open = ...` at top level, it might conflict if `open` is already declared at top level.
                // So we scan top level statements for declarations.
                //
                // Walk default-value expressions in params so identifiers that
                // appear ONLY in defaults (e.g. `myFn(color bg = na) =>`) still
                // register as used. Otherwise the implicit destructure misses
                // them and JS throws "ReferenceError: na is not defined" when
                // the default fires at a call site that omitted the arg.
                for (const p of node.params) {
                    if (p && p.type === 'AssignmentPattern' && p.right) {
                        c(p.right, state);
                    }
                }
                c(node.body, state);
            },
            Identifier(node: any, state: any, c: any) {
                // Check if this identifier is a reference (usage)
                // We exclude property names in MemberExpressions (unless computed) and ObjectProperties
                usedIdentifiers.add(node.name);
            },
            MemberExpression(node: any, state: any, c: any) {
                c(node.object, state);
                if (node.computed) {
                    c(node.property, state);
                }
                // If not computed, property is an Identifier but not a variable reference
            },
            Property(node: any, state: any, c: any) {
                if (node.computed) {
                    c(node.key, state);
                }
                c(node.value, state);
            },
        }
    );

    // Correct approach: Scan top-level body for declarations
    mainBody.forEach((stmt: any) => {
        if (stmt.type === 'VariableDeclaration') {
            stmt.declarations.forEach((d: any) => addDeclared(d.id));
        } else if (stmt.type === 'FunctionDeclaration') {
            addDeclared(stmt.id);
        }
    });

    // 3. Define implicit variables
    const contextDataVars = CONTEXT_DATA_VARS;

    const contextPineVars = CONTEXT_PINE_VARS;

    // 4. Identify missing variables
    const missingDataVars = contextDataVars.filter((v) => !declaredVars.has(v));
    const missingPineVars = contextPineVars.filter((v) => !declaredVars.has(v));

    const neededDataVars = missingDataVars.filter((v) => usedIdentifiers.has(v));
    const neededPineVars = missingPineVars.filter((v) => usedIdentifiers.has(v));

    // 5. Create Injection Nodes
    const injections: any[] = [];

    if (neededDataVars.length > 0) {
        // const { open, ... } = context.data;
        injections.push({
            type: 'VariableDeclaration',
            kind: 'const',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'ObjectPattern',
                        properties: neededDataVars.map((name) => ({
                            type: 'Property',
                            key: { type: 'Identifier', name },
                            value: { type: 'Identifier', name },
                            kind: 'init',
                            shorthand: true,
                        })),
                    },
                    init: {
                        type: 'MemberExpression',
                        object: { type: 'Identifier', name: contextParamName },
                        property: { type: 'Identifier', name: 'data' },
                        computed: false,
                    },
                },
            ],
        });
    }

    if (neededPineVars.length > 0) {
        // const { ta, ... } = context.pine;
        injections.push({
            type: 'VariableDeclaration',
            kind: 'const',
            declarations: [
                {
                    type: 'VariableDeclarator',
                    id: {
                        type: 'ObjectPattern',
                        properties: neededPineVars.map((name) => ({
                            type: 'Property',
                            key: { type: 'Identifier', name },
                            value: { type: 'Identifier', name },
                            kind: 'init',
                            shorthand: true,
                        })),
                    },
                    init: {
                        type: 'MemberExpression',
                        object: { type: 'Identifier', name: contextParamName },
                        property: { type: 'Identifier', name: 'pine' },
                        computed: false,
                    },
                },
            ],
        });
    }

    // 6. Inject at the beginning
    if (injections.length > 0) {
        mainBody.unshift(...injections);
    }
}
