// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 LuxAlgo

/**
 * Shared AST helpers for `input.*` declarations on NON-variable targets —
 * member-assignment (`cfg.show := input.bool(...)`) and expression-wrapped
 * assignments (`width = input.int(1) * 2`).
 *
 * Both the input scanner (scanInputs) and the transpiler (StatementTransformer)
 * need the same two facts:
 *   1. Is this init expression an `input.*` call (possibly nested inside a
 *      pure arithmetic / conditional tree)?  → the CallExpression itself.
 *   2. What path was it assigned to, exactly as written in Pine (`Identifier`
 *      or dotted `MemberExpression` chain)?  → the varId string.
 *
 * Keeping the two in lock-step guarantees the meta varId (what UIs expose /
 * key overrides by) equals the runtime `{ __varId }` sentinel the transpiler
 * injects (how the runtime resolves overrides).
 */

/** True when `callee` is `input.<fn>` or the bare `input` wrapper. */
export function isInputCallee(callee: any): boolean {
    if (!callee) return false;
    if (
        callee.type === 'MemberExpression' &&
        callee.object?.type === 'Identifier' &&
        callee.object.name === 'input' &&
        callee.property?.type === 'Identifier'
    ) {
        return true;
    }
    return callee.type === 'Identifier' && callee.name === 'input';
}

/**
 * Descend only through "pure" expression containers (arithmetic, logical,
 * conditional, unary, grouping) to locate an `input.*` call. Stops at any
 * other CallExpression — an input buried inside `ta.sma(input.int(1), 5)` is
 * an argument to something else, not the assignment's own input declaration.
 * Returns the first input call found, or null.
 */
export function findInputCallInExpression(expr: any): any | null {
    if (!expr) return null;
    if (expr.type === 'CallExpression') {
        return isInputCallee(expr.callee) ? expr : null;
    }
    let children: any | any[] | undefined;
    switch (expr.type) {
        case 'BinaryExpression':
        case 'LogicalExpression':
            children = [expr.left, expr.right];
            break;
        case 'ConditionalExpression':
            children = [expr.test, expr.consequent, expr.alternate];
            break;
        case 'UnaryExpression':
        case 'AwaitExpression':
        case 'ParenthesizedExpression':
            children = expr.argument;
            break;
        default:
            return null;
    }
    const iterate = Array.isArray(children) ? children : [children];
    for (const child of iterate) {
        if (!child) continue;
        const found = findInputCallInExpression(child);
        if (found) return found;
    }
    return null;
}

/**
 * Flatten an assignment target into its Pine-level handle — `Identifier` name
 * (`len`) or dotted member chain (`cfg.settings.show`). Returns undefined when
 * the target isn't a plain named path (computed access, call results, ...).
 */
export function memberExpressionPath(node: any): string | undefined {
    if (!node) return undefined;
    if (node.type === 'Identifier' && typeof node.name === 'string') return node.name;
    if (node.type === 'MemberExpression' && !node.computed) {
        const obj = memberExpressionPath(node.object);
        const prop = node.property?.type === 'Identifier' ? node.property.name : undefined;
        if (obj !== undefined && prop !== undefined) return `${obj}.${prop}`;
    }
    return undefined;
}