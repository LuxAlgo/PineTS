// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import * as walk from 'acorn-walk';
import { CONTEXT_NAME } from '../utils/ASTFactory';
import { CONTEXT_CORE_VARS, CONTEXT_DATA_VARS, CONTEXT_PINE_VARS, KNOWN_NAMESPACES } from '../settings';

/**
 * Normalizes imports from context.data and context.pine to prevent renaming of native symbols.
 * This ensures that symbols like 'close' or 'na' are always named 'close' and 'na' in the local scope,
 * satisfying the transpiler's expectation for exact naming of context-bound variables.
 *
 * Transforms:
 * const { close: close2 } = context.data;
 * to
 * const { close } = context.data;
 *
 * And renames all usages of 'close2' to 'close' within the scope.
 *
 * @param ast The AST to transform
 */
export function normalizeNativeImports(ast: any): void {
    // 1. Identify the main function body
    let mainBody: any[] | null = null;
    let contextParamName = CONTEXT_NAME;

    if (ast.type === 'Program' && ast.body.length > 0) {
        const firstStmt = ast.body[0];
        if (
            firstStmt.type === 'ExpressionStatement' &&
            (firstStmt.expression.type === 'ArrowFunctionExpression' || firstStmt.expression.type === 'FunctionExpression')
        ) {
            const fn = firstStmt.expression;
            if (fn.body.type === 'BlockStatement') {
                mainBody = fn.body.body;
                if (fn.params.length > 0 && fn.params[0].type === 'Identifier') {
                    contextParamName = fn.params[0].name;
                }
            }
        }
    }

    if (!mainBody) return;

    // 2. Define native symbols to watch for
    const contextDataVars = new Set(CONTEXT_DATA_VARS);

    const contextPineVars = new Set(CONTEXT_PINE_VARS);

    const contextCoreVars = new Set(CONTEXT_CORE_VARS);

    const renames = new Map<string, string>(); // alias -> original (e.g., 'close2' -> 'close')

    // 3. Scan for destructuring of context.data or context.pine
    mainBody.forEach((stmt: any) => {
        if (stmt.type === 'VariableDeclaration') {
            stmt.declarations.forEach((decl: any) => {
                if (
                    decl.init &&
                    decl.init.type === 'MemberExpression' &&
                    decl.init.object.type === 'Identifier' &&
                    decl.init.object.name === contextParamName &&
                    decl.init.property.type === 'Identifier'
                ) {
                    const sourceName = decl.init.property.name; // 'data' or 'pine'
                    let validNames: Set<string> | null = null;

                    if (sourceName === 'data') {
                        validNames = contextDataVars;
                    } else if (sourceName === 'pine') {
                        validNames = contextPineVars;
                    } else if (sourceName === 'core') {
                        validNames = contextCoreVars;
                    }

                    // Handle destructuring assignment: const { na: na2 } = context.pine;
                    if (validNames && decl.id.type === 'ObjectPattern') {
                        decl.id.properties.forEach((prop: any) => {
                            // Check for renaming: key.name != value.name
                            if (prop.type === 'Property' && prop.key.type === 'Identifier' && prop.value.type === 'Identifier') {
                                const originalName = prop.key.name;
                                const aliasName = prop.value.name;

                                if (validNames!.has(originalName) && originalName !== aliasName) {
                                    // Found a rename of a native symbol
                                    renames.set(aliasName, originalName);

                                    // Fix the declaration to use shorthand (remove rename)
                                    prop.value.name = originalName;
                                    prop.shorthand = true;
                                }
                            }
                        });
                    }
                    // Handle direct namespace assignment: const ta2 = context.ta;
                    else if (decl.id.type === 'Identifier') {
                        if (KNOWN_NAMESPACES.includes(sourceName)) {
                            const originalName = sourceName;
                            const aliasName = decl.id.name;

                            if (originalName !== aliasName) {
                                // Found a rename of a namespace
                                renames.set(aliasName, originalName);

                                // Fix the declaration
                                decl.id.name = originalName;
                            }
                        }
                    }
                }
            });
        }
    });

    // 4. If renames found, replace usages in the AST
    if (renames.size > 0) {
        // We need to walk the AST and replace identifiers
        // We must be careful to only replace variable references, not property keys

        // We can use walk.recursive starting from the main function (represented by ast here, but we should focus on the body)
        // Actually, we can walk the whole AST since renames are unique aliases generated in the scope.
        // Provided 'close2' isn't used in some other unrelated scope (which shouldn't happen in this simple structure).

        walk.recursive(
            ast,
            {},
            {
                Identifier(node: any) {
                    if (renames.has(node.name)) {
                        node.name = renames.get(node.name);
                    }
                },
                // Prevent renaming of non-computed property keys
                MemberExpression(node: any, state: any, c: any) {
                    c(node.object, state);
                    if (node.computed) {
                        c(node.property, state);
                    }
                },
                Property(node: any, state: any, c: any) {
                    if (node.computed) {
                        c(node.key, state);
                    }
                    // Value is always visited (it's the variable usage or declaration)
                    c(node.value, state);
                },
            }
        );
    }
}
