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
    transformWhileStatement,
    transformIfStatement,
    transformFunctionDeclaration,
    createLoopGuardNodes,
} from './StatementTransformer';

/**
 * Post-pass: propagate async/await through user-defined function call chains.
 *
 * When request.security() is used inside a user-defined function, the transpiler
 * injects `await` but doesn't mark the function as `async` or propagate await
 * to callers via $.call(). This pass:
 * 1. Finds all FunctionDeclarations containing AwaitExpression (directly, not in nested functions)
 * 2. Marks them as async
 * 3. Wraps $.call(fn, ...) invocations of those functions in AwaitExpression
 * 4. Repeats until stable (handles transitive async infection: A calls B calls request.security)
 */
export function propagateAsyncAwait(ast: any): void {
    const baseVisitor = { ...walk.base, LineComment: () => {} };

    // Helper: extract function name from $.call() first argument
    // Handles both: $.call(funcName, ...) and $.call($.get(funcName, 0), ...)
    function getCallTargetName(arg: any): string | null {
        if (!arg) return null;
        if (arg.type === 'Identifier') return arg.name;
        if (arg.type === 'CallExpression' &&
            arg.callee?.type === 'MemberExpression' &&
            arg.callee.object?.name === '$' &&
            arg.callee.property?.name === 'get' &&
            arg.arguments?.[0]?.type === 'Identifier') {
            return arg.arguments[0].name;
        }
        return null;
    }

    // Step 1: Collect all function declarations by name
    const funcDecls = new Map<string, any>();
    walk.simple(ast, {
        FunctionDeclaration(node: any) {
            if (node.id?.name) funcDecls.set(node.id.name, node);
        },
    }, baseVisitor);

    // Helper: check if a function body contains AwaitExpression at its own scope
    // (not descending into nested functions — each function is its own async scope)
    function bodyContainsAwait(body: any): boolean {
        let found = false;
        // Custom walker that stops at function boundaries
        const scopedVisitor = {
            ...baseVisitor,
            // Override function types to NOT descend
            FunctionDeclaration: () => {},
            FunctionExpression: () => {},
            ArrowFunctionExpression: () => {},
        };
        walk.simple(body, {
            AwaitExpression() { found = true; },
        }, scopedVisitor);
        return found;
    }

    // Step 2: Iterate until stable — propagate async through the call chain
    let changed = true;
    let iterations = 0;
    while (changed && iterations < 20) {
        changed = false;
        iterations++;

        // 2a: Mark arrow/function expressions as async if their body contains await
        walk.simple(ast, {
            ArrowFunctionExpression(node: any) {
                if (!node.async && bodyContainsAwait(node.body)) {
                    node.async = true;
                    changed = true;
                }
            },
            FunctionExpression(node: any) {
                if (!node.async && bodyContainsAwait(node.body)) {
                    node.async = true;
                    changed = true;
                }
            },
        }, baseVisitor);

        // 2b: Wrap async IIFE calls in await
        // Pattern: (async () => {...})() returns a Promise → needs await
        const iifeToWrap: any[] = [];
        walk.simple(ast, {
            CallExpression(node: any) {
                if (!node._asyncWrapped &&
                    (node.callee?.type === 'ArrowFunctionExpression' ||
                     node.callee?.type === 'FunctionExpression') &&
                    node.callee.async === true) {
                    iifeToWrap.push(node);
                }
            },
        }, baseVisitor);
        for (const node of iifeToWrap) {
            const clone: any = {};
            for (const k of Object.keys(node)) { clone[k] = node[k]; }
            clone._asyncWrapped = true;
            for (const k of Object.keys(node)) { delete node[k]; }
            node.type = 'AwaitExpression';
            node.argument = clone;
            changed = true;
        }

        // 2c: Find named functions containing await, mark them async
        const asyncFuncNames = new Set<string>();
        for (const [name, decl] of funcDecls) {
            if (bodyContainsAwait(decl.body)) {
                if (!decl.async) {
                    decl.async = true;
                    changed = true;
                }
                asyncFuncNames.add(name);
            }
        }

        // 2d: Wrap $.call(asyncFunc, ...) invocations in await
        if (asyncFuncNames.size > 0) {
            const toWrap: any[] = [];
            walk.simple(ast, {
                CallExpression(node: any) {
                    if (!node._asyncWrapped &&
                        node.callee?.type === 'MemberExpression' &&
                        node.callee.object?.name === '$' &&
                        node.callee.property?.name === 'call' &&
                        node.arguments?.length > 0) {
                        const targetName = getCallTargetName(node.arguments[0]);
                        if (targetName && asyncFuncNames.has(targetName)) {
                            toWrap.push(node);
                        }
                    }
                },
            }, baseVisitor);

            for (const node of toWrap) {
                const clone: any = {};
                for (const k of Object.keys(node)) { clone[k] = node[k]; }
                clone._asyncWrapped = true;
                for (const k of Object.keys(node)) { delete node[k]; }
                node.type = 'AwaitExpression';
                node.argument = clone;
                changed = true;
            }
        }
    }
}

// Pine comparison operators → na-aware runtime helpers. Includes the
// relational operators (<, <=, >, >=), which native JS would evaluate against
// NaN as `false`; routing them through the helpers makes `na` propagate and
// applies TradingView's 1e-10 tolerance.
const COMPARISON_METHODS: Record<string, string> = {
    '==': '__eq',
    '===': '__eq',
    '!=': '__neq',
    '!==': '__neq',
    '<': '__lt',
    '<=': '__le',
    '>': '__gt',
    '>=': '__ge',
};

const RELATIONAL_OPERATORS = new Set(['<', '<=', '>', '>=']);

// Loop-control comparisons whose operands are integer counters (never `na`):
// the `test`/`update` of for/while/do-while headers, and the generated loop
// guard (flagged `_skipCompare`). Routing these through the helpers would add
// a per-iteration call for no benefit, so relational ops here stay native.
// `==`/`!=` still transform everywhere (unchanged from prior behavior).
function isLoopControlRelational(node: any, ancestors: any[]): boolean {
    if (node._skipCompare) return true;
    // ancestors = [root, ..., parent, node]. A for-header lowers `for i = 0 to n`
    // to `(0 <= n ? i <= n : i >= n)` / `(0 <= n ? i++ : i--)`, so the counter
    // comparisons live nested inside ForStatement.test / .update — walk the whole
    // chain and skip anything inside an enclosing loop header's test/update.
    for (let k = 0; k < ancestors.length - 1; k++) {
        const anc = ancestors[k];
        const child = ancestors[k + 1];
        if (anc.type === 'ForStatement' && (child === anc.test || child === anc.update)) return true;
        if ((anc.type === 'WhileStatement' || anc.type === 'DoWhileStatement') && child === anc.test) return true;
    }
    return false;
}

export function transformEqualityChecks(ast: any): void {
    const baseVisitor = { ...walk.base, LineComment: () => {} };
    walk.ancestor(
        ast,
        {
            BinaryExpression(node: any, _state: any, ancestors: any[]) {
                // Transform equality/inequality AND relational operators to
                // na-aware versions. In Pine Script, any comparison with `na`
                // evaluates to `na` (not false) — for ==, !=, and <, <=, >, >=
                // (verified against TradingView). Native JS would give false
                // (NaN < 1, NaN == NaN, ...), so we route through the runtime
                // helpers which propagate `na` and apply the 1e-10 tolerance.
                // `na` is falsy, so branch/ternary outcomes are unchanged.
                const method = COMPARISON_METHODS[node.operator];
                if (!method) return;
                if (RELATIONAL_OPERATORS.has(node.operator) && isLoopControlRelational(node, ancestors)) return;
                const callExpr = ASTFactory.createMathCompareCall(method, node.left, node.right);
                callExpr._transformed = true;
                Object.assign(node, callExpr);
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
        ReturnStatement(node: any, state: ScopeManager, c: any) {
            // Walk into return argument for types not handled by transformReturnStatement.
            // transformReturnStatement has two handling phases:
            //   Phase 1 (always): ArrayExpression, ObjectExpression, Identifier, MemberExpression
            //   Phase 2 (curScope==='fn' only): BinaryExpression, LogicalExpression,
            //     ConditionalExpression, CallExpression — uses its own walk.recursive
            // When curScope !== 'fn' (e.g. return inside if/else within a function),
            // Phase 2 is skipped and complex expression types go untransformed.
            // We call c() to walk those cases, but ONLY when Phase 2 won't run,
            // to avoid double-transformation.
            if (node.argument &&
                node.argument.type !== 'ArrayExpression' &&
                node.argument.type !== 'ObjectExpression' &&
                node.argument.type !== 'Identifier' &&
                node.argument.type !== 'MemberExpression' &&
                state.getCurrentScopeType() !== 'fn') {
                c(node.argument, state);
            }
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
            // Transform the right (iterable expression) and wrap it with a runtime helper that
            // resolves Pine collection iteration uniformly:
            //   for x in coll       → for (const x of $.iter(coll))
            //   for [i, x] in coll  → for (const [i, x] of $.entries(coll))
            // $.iter / $.entries handle PineArrayObject (.array unwrap), plain JS arrays
            // (built-ins like box.all), and pass-through for already-iterable values.
            // Centralizing the resolution avoids special-casing the codegen for each iterable
            // shape and removes the static-typing guesswork.
            if (node.right) {
                if (node.right.type === 'Identifier') {
                    // transformIdentifier may already wrap user variables in $.get($.var.X, 0).
                    // addArrayAccess reads the (stale) node.name and overwrites the result.
                    // Fix: call transformIdentifier, then only call addArrayAccess if the node
                    // wasn't already transformed (i.e. it's still an Identifier).
                    transformIdentifier(node.right, state);
                    if (node.right.type === 'Identifier') {
                        // transformIdentifier didn't rename this (context-bound / built-in var)
                        addArrayAccess(node.right, state);
                    }
                } else {
                    // MemberExpression / CallExpression / etc. — recurse so nested identifiers
                    // get transformed before we wrap the whole expression below.
                    c(node.right, state);
                }

                const isDestructuring = node.left && node.left.type === 'VariableDeclaration' &&
                    node.left.declarations[0].id.type === 'ArrayPattern';
                const helperName = isDestructuring ? 'entries' : 'iter';

                // Build: $.<helperName>(<currentRight>)
                const currentRight = { ...node.right };
                const wrapped = ASTFactory.createCallExpression(
                    ASTFactory.createMemberExpression(
                        ASTFactory.createIdentifier('$'),
                        ASTFactory.createIdentifier(helperName),
                        false
                    ),
                    [currentRight]
                );

                Object.assign(node.right, wrapped);
            }
            // Inject loop guard: hoist counter declaration before the loop
            const forOfGuardName = state.getNextLoopGuardName();
            const forOfGuard = createLoopGuardNodes(forOfGuardName);
            state.addHoistedStatement(forOfGuard.counterDecl);

            // Traverse the body
            if (node.body) {
                c(node.body, state);
            }

            // Prepend guard check as the first statement in the loop body
            if (node.body && node.body.type === 'BlockStatement') {
                node.body.body.unshift(forOfGuard.guardCheck);
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
        WhileStatement(node: any, state: ScopeManager, c: any) {
            transformWhileStatement(node, state, c);
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
