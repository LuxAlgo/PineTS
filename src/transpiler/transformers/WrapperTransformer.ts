// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

import * as acorn from 'acorn';
import { generate } from 'astring';

/**
 * Checks if the code is already wrapped in a function.
 * Returns an object with wrapping status and async status.
 */
function checkFunctionWrapping(code: string): { isWrapped: boolean; isAsync: boolean; functionNode?: any } {
    try {
        const ast = acorn.parse(code, {
            ecmaVersion: 'latest',
            sourceType: 'module',
        });

        // Check if the entire program is a single statement containing a function
        if (ast.type === 'Program' && ast.body.length === 1) {
            const firstStatement = ast.body[0];

            // Check for ExpressionStatement containing ArrowFunctionExpression or FunctionExpression
            if (firstStatement.type === 'ExpressionStatement') {
                const expr = firstStatement.expression;
                if (expr.type === 'ArrowFunctionExpression' || expr.type === 'FunctionExpression') {
                    return { isWrapped: true, isAsync: expr.async || false, functionNode: expr };
                }
            }

            // Check for FunctionDeclaration
            if (firstStatement.type === 'FunctionDeclaration') {
                return { isWrapped: true, isAsync: firstStatement.async || false, functionNode: firstStatement };
            }
        }

        return { isWrapped: false, isAsync: false };
    } catch (e) {
        // If parsing fails, assume it's not wrapped
        return { isWrapped: false, isAsync: false };
    }
}

/**
 * Converts a non-async function to an async function by modifying the AST.
 */
function convertToAsync(functionNode: any): string {
    // Set the async flag to true
    functionNode.async = true;

    // Generate code from the modified AST
    return generate(functionNode);
}

/**
 * Wraps unwrapped code in a context arrow function.
 * If the code is already wrapped in a function:
 *   - If async, returns it as-is
 *   - If not async, converts it to async
 * Otherwise, wraps it in: async (context) => { ... }
 *
 * @param code The input code string
 * @returns The wrapped code string (always async)
 */
export function wrapInContextFunction(code: string): string {
    code = code.trim();

    // Check if already wrapped and whether it's async
    const { isWrapped, isAsync, functionNode } = checkFunctionWrapping(code);

    if (isWrapped && functionNode) {
        // If wrapped but not async, convert to async
        if (!isAsync) {
            return convertToAsync(functionNode);
        }
        // Already wrapped and async, return as-is
        return code;
    }

    // Not wrapped, wrap in async context arrow function
    return `async (context) => {\n${code}\n}`;
}
